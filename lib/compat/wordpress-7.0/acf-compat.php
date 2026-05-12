<?php
/**
 * ACF Compatibility Fix for Gutenberg Editor
 *
 * Ensures that ACF fields and other custom meta fields are accessible
 * when using the Gutenberg block editor.
 *
 * @package gutenberg
 */

/**
 * Ensures the WordPress Custom Fields meta box remains available for plugins
 * that may depend on it, even when other plugins remove it.
 *
 * This fixes the issue where ACF removes the postcustom meta box when
 * Gutenberg is detected, which also removes the native Custom Fields panel.
 *
 * @param array $wp_meta_boxes Global meta box state.
 * @return array Modified meta box state.
 */
function gutenberg_restore_custom_fields_meta_box( $wp_meta_boxes ) {
	global $current_screen;

	// Only apply to block editor screens
	if ( ! $current_screen || ! $current_screen->block_editor ) {
		return $wp_meta_boxes;
	}

	$screen_id = $current_screen->id;

	// Check if we're in a post type that supports custom fields
	$post_type = get_post_type_object( $current_screen->post_type );
	if ( ! $post_type || ! post_type_supports( $post_type->name, 'custom-fields' ) ) {
		return $wp_meta_boxes;
	}

	// If postcustom meta box was removed (e.g., by ACF), restore it
	// but mark it as plugin-managed so it's clear it's available
	$postcustom_removed = true;
	if ( isset( $wp_meta_boxes[ $screen_id ] ) ) {
		foreach ( $wp_meta_boxes[ $screen_id ] as $location => $priorities ) {
			foreach ( $priorities as $priority => $boxes ) {
				if ( isset( $boxes['postcustom'] ) && false !== $boxes['postcustom'] ) {
					$postcustom_removed = false;
					break 2;
				}
			}
		}
	}

	// Restore the custom fields meta box if it was removed
	if ( $postcustom_removed ) {
		$default_meta_boxes = array(
			'normal' => array(
				'core' => array(
					'postcustom' => array(
						'id'       => 'postcustom',
						'title'    => __( 'Custom Fields', 'gutenberg' ),
						'callback' => 'post_custom_meta_box',
						'args'     => array(
							'__block_editor_compatible_meta_box' => true,
							'__gutenberg_restored' => true,
						),
					),
				),
			),
		);

		$wp_meta_boxes = array_merge_recursive( $default_meta_boxes, $wp_meta_boxes );
	}

	return $wp_meta_boxes;
}
add_filter( 'filter_block_editor_meta_boxes', 'gutenberg_restore_custom_fields_meta_box', 50 );

/**
 * Add notification about custom fields availability in Gutenberg.
 *
 * When ACF or other plugins hide the Custom Fields panel, we inform users
 * that they can enable it via the Options menu.
 *
 * @param array $settings Editor settings.
 * @return array Modified settings.
 */
function gutenberg_custom_fields_editor_settings( $settings ) {
	global $current_screen;

	if ( ! $current_screen || ! $current_screen->block_editor ) {
		return $settings;
	}

	$post_type = get_post_type_object( $current_screen->post_type );
	if ( ! $post_type || ! post_type_supports( $post_type->name, 'custom-fields' ) ) {
		return $settings;
	}

	// Add flag to indicate custom fields are technically supported
	// even if the meta box is hidden by a plugin
	$settings['__customFieldsSupported'] = true;

	return $settings;
}
add_filter( 'block_editor_settings', 'gutenberg_custom_fields_editor_settings', 20 );
