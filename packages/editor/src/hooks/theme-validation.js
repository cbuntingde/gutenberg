/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';

/**
 * useThemeValidation hook
 *
 * Provides theme validation checking for block theme compatibility issues.
 * Validates that theme.json exists and provides appropriate warnings.
 *
 * @return {Object} Theme validation state and helper functions.
 */
export function useThemeValidation() {
	const { currentTheme, themeSupports } = useSelect( ( select ) => {
		return {
			currentTheme: select( coreStore ).getCurrentTheme(),
			themeSupports: select( coreStore ).getThemeSupports(),
		};
	}, [] );

	const isBlockTheme = currentTheme?.is_block_theme === true;

	const getValidationIssues = useCallback( () => {
		const issues = [];

		// Check for missing theme.json in block themes
		if ( isBlockTheme && ! currentTheme?.has_theme_json ) {
			issues.push( {
				code: 'missing_theme_json',
				message:
					'The active block theme is missing a theme.json file. This may cause styling issues.',
				severity: 'warning',
			} );
		}

		// Check for missing layout support (affects block alignment)
		if ( isBlockTheme && ! themeSupports?.layout ) {
			issues.push( {
				code: 'no_layout_support',
				message:
					'The theme does not declare layout support. You may need to wrap blocks in a group to use alignment.',
				severity: 'info',
			} );
		}

		// Check for missing color palette (affects color blocks)
		if ( isBlockTheme && ! themeSupports?.color ) {
			issues.push( {
				code: 'no_color_support',
				message:
					'The theme does not declare color support. Color settings may not be available.',
				severity: 'info',
			} );
		}

		// Check for missing blockGap support (affects spacing)
		if (
			isBlockTheme &&
			! themeSupports?.spacing &&
			! themeSupports?.__experimentalSpacing
		) {
			issues.push( {
				code: 'no_spacing_support',
				message:
					'The theme does not declare spacing support. Spacing controls may not be available.',
				severity: 'info',
			} );
		}

		// Check for editor-styles support (affects block editor appearance)
		if ( isBlockTheme && ! themeSupports?.[ 'editor-styles' ] ) {
			issues.push( {
				code: 'no_editor_styles',
				message:
					'The theme does not enable editor styles. The editor appearance may differ from the frontend.',
				severity: 'warning',
			} );
		}

		return issues;
	}, [ isBlockTheme, currentTheme, themeSupports ] );

	return {
		currentTheme,
		isBlockTheme,
		themeSupports,
		getValidationIssues,
	};
}

/**
 * useBlockThemeCompatibility hook
 *
 * Provides compatibility utilities for both block themes and classic themes.
 * Helps determine appropriate UI patterns based on theme type.
 *
 * @return {Object} Compatibility helpers.
 */
export function useBlockThemeCompatibility() {
	const { currentTheme, editorSettings } = useSelect( ( select ) => {
		return {
			currentTheme: select( coreStore ).getCurrentTheme(),
			editorSettings: select( editorStore ).getEditorSettings(),
		};
	}, [] );

	const isBlockTheme = currentTheme?.is_block_theme === true;
	const hasThemeJson = !! currentTheme?.has_theme_json;

	// Check if global styles are available (only in block themes with theme.json)
	const hasGlobalStyles =
		isBlockTheme &&
		select( coreStore ).__experimentalGetCurrentGlobalStylesId() !==
			undefined;

	// Check if templates can be used (block themes always support templates)
	const supportsTemplates =
		isBlockTheme || editorSettings?.supportsTemplateMode === true;

	// Determine if we should offer block-based template editing
	const shouldOfferBlockTemplates =
		isBlockTheme ||
		( ! isBlockTheme && editorSettings?.supportsTemplateMode === true );

	// Get theme-specific settings
	const getThemeSettings = useCallback( () => {
		return {
			isBlockTheme,
			hasThemeJson,
			hasGlobalStyles,
			supportsTemplates,
			themeStylesheet: currentTheme?.stylesheet,
			themeName: currentTheme?.name?.rendered,
		};
	}, [
		isBlockTheme,
		hasThemeJson,
		hasGlobalStyles,
		supportsTemplates,
		currentTheme,
	] );

	return {
		isBlockTheme,
		hasThemeJson,
		hasGlobalStyles,
		supportsTemplates,
		shouldOfferBlockTemplates,
		getThemeSettings,
	};
}
