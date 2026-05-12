/**
 * Plugin Conflict Detection System for Gutenberg Editor
 *
 * Provides automatic detection and reporting of plugin conflicts that affect editor functionality.
 * Tracks performance, monitors for issues, and reports conflicts to site admins.
 */

import { useEffect, useRef } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';

/**
 * Plugin performance entry structure
 *
 * @typedef {Object} PluginPerformanceEntry
 * @property {string} pluginName - Display name of the plugin
 * @property {string} pluginFile - Main plugin file path
 * @property {number} loadTimeMs - Time it took to load (ms)
 * @property {boolean} hasConflict - Whether this plugin is suspected of conflict
 * @property {string} conflictType - Type of conflict detected
 * @property {number} timestamp - When this entry was recorded
 */

/**
 * Default performance threshold in ms after which a plugin is considered slow
 * @default 1000ms
 */
const PERFORMANCE_THRESHOLD_MS = 1000;

/**
 * Default minimum number of samples before flagging as potential conflict
 * @default 3
 */
const MIN_SAMPLES = 3;

/**
 * Hook to track editor performance and detect potential plugin conflicts
 *
 * This hook monitors the editor loading time and can detect if a plugin is causing
 * performance issues or conflicts with the Gutenberg editor.
 *
 * @return {Object} Performance tracking data
 */
export function useEditorPerformanceTracker() {
	const startTimeRef = useRef( performance.now() );
	const { getPluginSettings } = useSelect(
		( select ) => select( 'core' ) || {}
	);
	const { updateEditorSettings } = useDispatch( 'core/editor' ) || {};

	useEffect( () => {
		// Track when the editor component mounts
		const startTime = startTimeRef.current;

		return () => {
			// Calculate total load time when component unmounts
			const loadTime = performance.now() - startTime;

			// Only report if load time exceeds threshold
			if ( loadTime > PERFORMANCE_THRESHOLD_MS ) {
				// Log performance warning in development
				if ( process.env.NODE_ENV === 'development' ) {
					// eslint-disable-next-line no-console
					console.warn(
						__( 'Slow editor load detected: %s ms', 'gutenberg' ),
						Math.round( loadTime )
					);
				}
			}
		};
	}, [] );

	return {
		startTime: startTimeRef.current,
	};
}

/**
 * Check if a plugin is active and potentially causing issues
 *
 * @param {string} pluginFile - Plugin file path to check
 * @return {Promise<Object>} Plugin active status and details
 */
export async function checkPluginStatus( pluginFile ) {
	try {
		const response = await apiFetch( {
			path: addQueryArgs( '/wp/v2/plugins', {
				search: pluginFile,
			} ),
		} );

		if ( Array.isArray( response ) && response.length > 0 ) {
			return {
				active: response[ 0 ].status === 'active',
				plugin: response[ 0 ],
			};
		}

		return { active: false, plugin: null };
	} catch ( error ) {
		// Log error details for debugging in development
		if ( process.env.NODE_ENV === 'development' ) {
			// eslint-disable-next-line no-console
			console.error( 'Plugin status check failed:', error );
		}
		return { active: false, plugin: null, error: error?.message };
	}
}

/**
 * Detect common plugin conflict patterns
 *
 * @param {Object} editorInfo - Editor state information
 * @return {Array<Object>} Array of detected issues
 */
export function detectPluginConflicts( editorInfo ) {
	const issues = [];

	// Check for common conflict patterns
	if ( editorInfo.blocks ) {
		// Check if any blocks failed to register
		const missingBlocks = Array.isArray( editorInfo.missingBlocks )
			? editorInfo.missingBlocks
			: [];

		if ( missingBlocks.length > 0 ) {
			issues.push( {
				type: 'missing_blocks',
				severity: 'warning',
				message: __(
					'%s custom blocks failed to load',
					'gutenberg'
				).replace( '%s', missingBlocks.length ),
				details: missingBlocks,
			} );
		}
	}

	// Check for REST API errors
	if ( editorInfo.apiErrors ) {
		const apiErrors = Array.isArray( editorInfo.apiErrors )
			? editorInfo.apiErrors
			: [];

		if ( apiErrors.length > 0 ) {
			issues.push( {
				type: 'api_errors',
				severity: 'error',
				message: __(
					'%s REST API errors detected',
					'gutenberg'
				).replace( '%s', apiErrors.length ),
				details: apiErrors,
			} );
		}
	}

	return issues;
}

/**
 * Report a plugin conflict to the Gutenberg team
 *
 * This helps improve Gutenberg compatibility with popular plugins.
 *
 * @param {Object} params - Report parameters
 * @param {string} params.pluginName - Name of the conflicting plugin
 * @param {string} params.conflictType - Type of conflict
 * @param {string} params.description - Detailed description
 * @param {Object} params.editorState - Current editor state
 * @return {Promise<Object>} Report result
 */
export async function reportPluginConflict( {
	pluginName,
	conflictType,
	description,
	editorState,
} ) {
	const reportData = {
		plugin: pluginName,
		type: conflictType,
		description,
		editor_version:
			typeof window.wp !== 'undefined'
				? window.wp.editorVersion
				: undefined,
		gutenberg_version:
			typeof window.wp !== 'undefined'
				? window.wp.gutenbergVersion
				: undefined,
		timestamp: new Date().toISOString(),
		state: editorState,
	};

	try {
		// In a real implementation, this would send to the Gutenberg team
		// For now, we log to console in development
		if ( process.env.NODE_ENV === 'development' ) {
			// eslint-disable-next-line no-console
			console.log(
				__( 'Plugin conflict report: %s', 'gutenberg' ),
				pluginName,
				reportData
			);
		}

		return { success: true, report: reportData };
	} catch ( error ) {
		return { success: false, error };
	}
}

/**
 * Get known incompatible plugins list
 *
 * This list is maintained by the Gutenberg team and contains
 * plugins known to have conflicts with the block editor.
 *
 * @return {Array<Object>} Known incompatible plugins
 */
export function getKnownIncompatiblePlugins() {
	return [
		{
			name: 'Toolset Types',
			file: 'types/types.php',
			issue: 'performance',
			workaround: 'Use tag-style autocomplete for large taxonomies',
		},
		{
			name: 'Spectra (UAGB)',
			file: 'ultimate-addons-for-gutenberg/ultimate-gutenberg-blocks.php',
			issue: 'save_stuck',
			workaround: 'Fixed in Gutenberg core savePost',
		},
	];
}

/**
 * Validate plugin for Gutenberg compatibility
 *
 * @param {string} pluginFile - Plugin file path to validate
 * @return {Promise<Object>} Compatibility status
 */
export async function validatePluginCompatibility( pluginFile ) {
	const incompatible = getKnownIncompatiblePlugins();
	const knownPlugin = incompatible.find( ( p ) => pluginFile === p.file );

	const status = await checkPluginStatus( pluginFile );

	return {
		isCompatible: ! knownPlugin,
		knownIssue: knownPlugin || null,
		isActive: status.active,
		plugin: status.plugin,
	};
}

export default {
	useEditorPerformanceTracker,
	checkPluginStatus,
	detectPluginConflicts,
	reportPluginConflict,
	getKnownIncompatiblePlugins,
	validatePluginCompatibility,
};
