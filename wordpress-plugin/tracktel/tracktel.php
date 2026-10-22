<?php
/**
 * Plugin Name:       TrackTel
 * Description:       REST API для трекера привычек TrackTel (Telegram Mini App): серверная проверка Telegram-авторизации и изоляция данных пользователей.
 * Version:           0.1.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            TrackTel
 *
 * @package tracktel
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Запрет прямого доступа к файлу.
}

define( 'TRACKTEL_VERSION', '0.1.0' );
define( 'TRACKTEL_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );

require_once TRACKTEL_PLUGIN_DIR . 'includes/class-tracktel-telegram-auth.php';
require_once TRACKTEL_PLUGIN_DIR . 'includes/class-tracktel-rest.php';

/**
 * Ключ метаданных WP-пользователя, где хранится его Telegram ID.
 * Значение записывается только после успешной серверной проверки initData.
 */
define( 'TRACKTEL_TG_META_KEY', 'tracktel_telegram_id' );

/**
 * Ключ метаданных с данными приложения (JSON: habits, checkIns, tasks).
 */
define( 'TRACKTEL_DATA_META_KEY', 'tracktel_data' );

add_action( 'rest_api_init', array( 'TrackTel_Rest', 'register_routes' ) );
