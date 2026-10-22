<?php
/**
 * Серверная проверка данных авторизации Telegram Mini App.
 *
 * Реализует алгоритм проверки из документации Telegram Web Apps:
 * secret_key = HMAC_SHA256(bot_token, "WebAppData");
 * hash       = HMAC_SHA256(secret_key, data_check_string);
 *
 * Токен бота НИКОГДА не передаётся клиенту (ТЗ, раздел 8).
 *
 * @package tracktel
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class TrackTel_Telegram_Auth {

	/** Максимальный возраст initData (сек). */
	const MAX_AGE = 86400;

	/**
	 * Получить токен бота из настроек окружения (wp-config.php).
	 *
	 * Ожидается: define( 'TRACKTEL_BOT_TOKEN', '...' );
	 *
	 * @return string|null
	 */
	public static function get_bot_token() {
		$token = defined( 'TRACKTEL_BOT_TOKEN' ) ? TRACKTEL_BOT_TOKEN : '';
		return $token !== '' ? $token : null;
	}

	/**
	 * Проверить строку initData Telegram.
	 *
	 * @param string $init_data Строка initData из WebApp.initData.
	 * @return array|string Массив параметров при успехе, строка-описание ошибки при провале.
	 */
	public static function verify( $init_data ) {
		$bot_token = self::get_bot_token();
		if ( null === $bot_token ) {
			return 'Сервер не настроен: TRACKTEL_BOT_TOKEN не задан.';
		}

		if ( ! is_string( $init_data ) || '' === $init_data ) {
			return 'Пустые данные авторизации.';
		}

		$params = array();
		parse_str( $init_data, $params );

		$hash = isset( $params['hash'] ) ? (string) $params['hash'] : '';
		if ( '' === $hash ) {
			return 'Отсутствует поле hash.';
		}
		unset( $params['hash'] );

		// Контрольная строка: отсортированные пары key=value через «&».
		ksort( $params );
		$data_check_string = http_build_query( $params, '', '&', PHP_QUERY_RFC3986 );

		$secret_key    = hash_hmac( 'sha256', $bot_token, 'WebAppData', true );
		$expected_hash = hash_hmac( 'sha256', $data_check_string, $secret_key );

		if ( ! hash_equals( $expected_hash, $hash ) ) {
			return 'Подпись данных не совпадает.';
		}

		$auth_date = isset( $params['auth_date'] ) ? (int) $params['auth_date'] : 0;
		if ( $auth_date <= 0 || ( time() - $auth_date ) > self::MAX_AGE ) {
			return 'Данные авторизации устарели.';
		}

		$user = isset( $params['user'] ) ? json_decode( (string) $params['user'], true ) : null;
		if ( ! is_array( $user ) || empty( $user['id'] ) || ! is_numeric( $user['id'] ) ) {
			return 'Некорректное поле user.';
		}

		$params['user'] = $user;
		return $params;
	}

	/**
	 * Найти или создать WP-пользователя по Telegram ID.
	 *
	 * Telegram ID связывается с WP-пользователем только после verify().
	 *
	 * @param int $telegram_id Telegram ID из проверенных данных.
	 * @return int|WP_Error ID WP-пользователя.
	 */
	public static function get_or_create_wp_user( $telegram_id ) {
		$users = get_users(
			array(
				'meta_key'   => TRACKTEL_TG_META_KEY, // phpcs:ignore WordPress.DB.SlowDBQuery
				'meta_value' => (string) $telegram_id, // phpcs:ignore WordPress.DB.SlowDBQuery
				'number'     => 1,
				'fields'     => 'ID',
			)
		);

		if ( ! empty( $users ) ) {
			return (int) $users[0];
		}

		// Первый вход: создаём WP-пользователя-подписчика.
		$login = 'tg_' . $telegram_id;
		$pass  = wp_generate_password( 32 );
		$user_id = wp_create_user( $login, $pass, $telegram_id . '@tracktel.local' );

		if ( is_wp_error( $user_id ) ) {
			// Возможен конфликт логина — используем уникальный.
			$user_id = wp_create_user( $login . '_' . wp_generate_password( 6, false ), $pass, $telegram_id . '@tracktel.local' );
		}

		if ( is_wp_error( $user_id ) ) {
			return $user_id;
		}

		update_user_meta( (int) $user_id, TRACKTEL_TG_META_KEY, (string) $telegram_id );
		return (int) $user_id;
	}
}
