/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../store';

/**
 * Issue tracker for editor UX issues.
 *
 * Tracks and prioritizes UX issues based on severity and frequency.
 */

/**
 * Priority levels for UX issues.
 */
export const UX_PRIORITY = {
	CRITICAL: 0,
	HIGH: 1,
	MEDIUM: 2,
	LOW: 3,
};

/**
 * UX issue categories.
 */
export const UX_CATEGORIES = {
	ALIGNMENT_SPACING: 'alignment_spacing',
	BLOCK_SELECTION: 'block_selection',
	VISUAL_FEEDBACK: 'visual_feedback',
	KEYBOARD_NAVIGATION: 'keyboard_navigation',
	DRAG_DROP: 'drag_drop',
	UNDO_REDO: 'undo_redo',
	RESPONSIVE: 'responsive',
	ACCESSIBILITY: 'accessibility',
};

/**
 * Creates a new UX issue tracking entry.
 *
 * @param {Object} issue Issue data.
 * @return {Object} Formatted issue entry.
 */
function createUXIssue( issue ) {
	return {
		id: `ux-${ Date.now() }-${ crypto.randomUUID() }`,
		timestamp: Date.now(),
		priority: issue.priority ?? UX_PRIORITY.MEDIUM,
		category: issue.category ?? UX_CATEGORIES.VISUAL_FEEDBACK,
		title: issue.title,
		description: issue.description,
		stepsToReproduce: issue.stepsToReproduce ?? [],
		relatedComponents: issue.relatedComponents ?? [],
		status: 'open',
		assignee: null,
		...issue,
	};
}

/**
 * useUXIssueTracker hook
 *
 * Provides tracking and prioritization for UX issues.
 *
 * @return {Object} Issue tracking state and methods.
 */
export function useUXIssueTracker() {
	const [ issues, setIssues ] = useState( [] );

	// Add a new UX issue
	const addIssue = useCallback( ( issue ) => {
		const newIssue = createUXIssue( issue );
		setIssues( ( prev ) => [ ...prev, newIssue ] );
		return newIssue.id;
	}, [] );

	// Remove an issue by ID
	const removeIssue = useCallback( ( issueId ) => {
		setIssues( ( prev ) => prev.filter( ( i ) => i.id !== issueId ) );
	}, [] );

	// Update issue status
	const updateIssueStatus = useCallback( ( issueId, status ) => {
		setIssues( ( prev ) =>
			prev.map( ( issue ) =>
				issue.id === issueId ? { ...issue, status } : issue
			)
		);
	}, [] );

	// Get issues by category
	const getIssuesByCategory = useCallback(
		( category ) => {
			return issues.filter( ( issue ) => issue.category === category );
		},
		[ issues ]
	);

	// Get issues by priority
	const getIssuesByPriority = useCallback(
		( priority ) => {
			return issues.filter( ( issue ) => issue.priority === priority );
		},
		[ issues ]
	);

	// Get open issues
	const getOpenIssues = useCallback( () => {
		return issues.filter( ( issue ) => issue.status === 'open' );
	}, [ issues ] );

	// Get critical issues (priority 0)
	const getCriticalIssues = useCallback( () => {
		return issues.filter(
			( issue ) =>
				issue.priority === UX_PRIORITY.CRITICAL &&
				issue.status === 'open'
		);
	}, [ issues ] );

	// Clear all issues
	const clearIssues = useCallback( () => {
		setIssues( [] );
	}, [] );

	return {
		issues,
		addIssue,
		removeIssue,
		updateIssueStatus,
		getIssuesByCategory,
		getIssuesByPriority,
		getOpenIssues,
		getCriticalIssues,
		clearIssues,
		// Constants
		UX_PRIORITY,
		UX_CATEGORIES,
	};
}

/**
 * useUXHealthCheck hook
 *
 * Provides health check functionality for the editor.
 *
 * @return {Object} Health check state and methods.
 */
export function useUXHealthCheck() {
	// Check for common issues using the editor state
	const healthIssues = useSelect( ( select ) => {
		const issues = [];

		// Check if editor is ready
		const hasLoadedPost =
			select( editorStore ).hasFinishedResolution( 'getEditedPost' );

		if ( ! hasLoadedPost ) {
			issues.push( {
				code: 'editor_not_loaded',
				message: 'Editor content not fully loaded',
				severity: 'warning',
			} );
		}

		// Check for unsaved changes
		const isDirty = select( editorStore ).isEditedPostDirty();
		const postStatus =
			select( editorStore ).getEditedPostAttribute( 'status' );

		if ( isDirty && ! postStatus ) {
			issues.push( {
				code: 'unsaved_changes',
				message: 'Unsaved changes detected',
				severity: 'info',
			} );
		}

		return issues;
	}, [] );

	// Run additional checks if needed
	const runFullHealthCheck = useCallback( () => {
		return [
			{
				code: 'memory_usage',
				message: 'Check memory usage for large documents',
				severity: 'info',
			},
			{
				code: 'api_response_time',
				message: 'Check API response times',
				severity: 'info',
			},
		];
	}, [] );

	return {
		healthIssues,
		runFullHealthCheck,
	};
}
