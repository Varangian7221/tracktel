<?php
/**
 * REST-маршруты TrackTel.
 *
 * Каждый запрос обязан нести проверяемые Telegram initData в заголовке
 * X-Telegram-Init-Data. Данные читаются и пишутся ТОЛЬКО для WP-пользователя,
 * которого Telegram ID прошёл серверную проверку (ТЗ, раздел 8).
 *
 * @package tracktel
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class TrackTel_Rest {

	const ROUTE = '/tracktel/v1';
	const MAX_DATA_BYTES = 262144; // 256 КиБ — ограничение на данные пользователя.

	/**
	 * Регистрация маршрутов.
	 */
	public static function register_routes() {
		register_rest_route(
			self::ROUTE,
			'/ping',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'handle_ping' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			self::ROUTE,
			'/data',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'handle_get_data' ),
					'permission_callback' => array( __CLASS__, 'authenticate' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'handle_save_data' ),
					'permission_callback' => array( __CLASS__, 'authenticate' ),
					'args'                => array(
						'data' => array(
							'required'          => true,
							'type'              => 'object',
							'validate_callback' => array( __CLASS__, 'validate_data' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Проверка прав доступа: верифицируем Telegram initData и устанавливаем
	 * текущего WP-пользователя. Возвращает true только при успехе.
	 *
	 * @param WP_REST_Request $request Запрос.
	 * @return bool|WP_Error
	 */
	public static function authenticate( WP_REST_Request $request ) {
		$init_data = (string) $request->get_header( 'X-Telegram-Init-Data' );

		if ( '' === $init_data ) {
			return new WP_Error(
				'tracktel_unauthorized',
				'Отсутствует заголовок X-Telegram-Init-Data.',
				array( 'status' => 401 )
			);
		}

		$verified = TrackTel_Telegram_Auth::verify( $init_data );
		if ( is_string( $verified ) ) {
			return new WP_Error(
				'tracktel_unauthorized',
				'Авторизация Telegram не пройдена: ' . $verified,
				array( 'status' => 401 )
			);
		}

		$telegram_id = (int) $verified['user']['id'];
		$user_id     = TrackTel_Telegram_Auth::get_or_create_wp_user( $telegram_id );

		if ( is_wp_error( $user_id ) ) {
			return new WP_Error(
				'tracktel_user_error',
				'Не удалось получить пользователя.',
				array( 'status' => 500 )
			);
		}

		wp_set_current_user( $user_id );
		return true;
	}

	/**
	 * Служебный маршрут: проверка, что плагин активен.
	 *
	 * @return WP_REST_Response
	 */
	public static function handle_ping() {
		return rest_ensure_response(
			array(
				'ok'      => true,
				'app'     => 'tracktel',
				'version' => TRACKTEL_VERSION,
			)
		);
	}

	/**
	 * Чтение данных текущего пользователя.
	 *
	 * @param WP_REST_Request $request Запрос (пользователь уже установлен).
	 * @return WP_REST_Response|WP_Error
	 */
	public static function handle_get_data( WP_REST_Request $request ) {
		$user_id = get_current_user_id();
		if ( $user_id <= 0 ) {
			return new WP_Error( 'tracktel_unauthorized', 'Пользователь не определён.', array( 'status' => 401 ) );
		}

		$raw  = get_user_meta( $user_id, TRACKTEL_DATA_META_KEY, true );
		$data = self::parse_data( $raw );

		return rest_ensure_response( array( 'data' => $data ) );
	}

	/**
	 * Сохранение данных текущего пользователя (полная замена набора).
	 *
	 * @param WP_REST_Request $request Запрос.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function handle_save_data( WP_REST_Request $request ) {
		$user_id = get_current_user_id();
		if ( $user_id <= 0 ) {
			return new WP_Error( 'tracktel_unauthorized', 'Пользователь не определён.', array( 'status' => 401 ) );
		}

		$data = $request->get_param( 'data' );
		$json = wp_json_encode( self::normalize_data( $data ) );

		if ( false === $json || strlen( $json ) > self::MAX_DATA_BYTES ) {
			return new WP_Error( 'tracktel_payload_too_large', 'Данные повреждены или слишком велики.', array( 'status' => 413 ) );
		}

		$saved = update_user_meta( $user_id, TRACKTEL_DATA_META_KEY, $json );
		if ( false === $saved ) {
			return new WP_Error( 'tracktel_save_failed', 'Не удалось сохранить данные.', array( 'status' => 500 ) );
		}

		return rest_ensure_response( array( 'ok' => true ) );
	}

	/**
	 * Валидация структуры данных (args.validate_callback).
	 *
	 * @param mixed $value Значение.
	 * @return bool
	 */
	public static function validate_data( $value ) {
		return is_array( $value ) && isset( $value['habits'], $value['checkIns'], $value['tasks'] );
	}

	/**
	 * Разбор сохранённого JSON в безопасную структуру.
	 *
	 * @param mixed $raw Сырое значение мета-поля.
	 * @return array
	 */
	private static function parse_data( $raw ) {
		if ( ! is_string( $raw ) || '' === $raw ) {
			return self::normalize_data( array() );
		}
		$decoded = json_decode( $raw, true );
		return self::normalize_data( is_array( $decoded ) ? $decoded : array() );
	}

	/**
	 * Приведение набора данных к ожидаемой форме.
	 *
	 * @param array $data Данные.
	 * @return array
	 */
	private static function normalize_data( $data ) {
		$pick = static function ( $key ) use ( $data ) {
			return isset( $data[ $key ] ) && is_array( $data[ $key ] ) ? array_values( $data[ $key ] ) : array();
		};

		return array(
			'habits'   => $pick( 'habits' ),
			'checkIns' => $pick( 'checkIns' ),
			'tasks'    => $pick( 'tasks' ),
		);
	}
}
