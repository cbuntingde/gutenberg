/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ATTACHMENT_POST_TYPE } from '../constants';

/**
 * Builds the arguments for a success notification dispatch.
 *
 * @param {Object} data Incoming data to build the arguments from.
 *
 * @return {Array} Arguments for dispatch. An empty array signals no
 *                 notification should be sent.
 */
export function getNotificationArgumentsForSaveSuccess( data ) {
	const { previousPost, post, postType } = data;
	// Autosaves are neither shown a notice nor redirected.
	if ( data.options?.isAutosave ) {
		return [];
	}

	const publishStatus = [ 'publish', 'private', 'future' ];
	const isPublished = publishStatus.includes( previousPost.status );
	const willPublish = publishStatus.includes( post.status );
	const willTrash =
		post.status === 'trash' && previousPost.status !== 'trash';

	let noticeMessage;
	let shouldShowLink = postType?.viewable ?? false;
	let isDraft;

	// Always should a notice, which will be spoken for accessibility.
	if ( willTrash ) {
		noticeMessage = postType.labels.item_trashed;
		shouldShowLink = false;
	} else if ( post.type === ATTACHMENT_POST_TYPE ) {
		// Attachments should always show a simple updated message because they don't have a draft state.
		noticeMessage = __( 'Media updated.' );
		shouldShowLink = false;
	} else if ( ! isPublished && ! willPublish ) {
		// If saving a non-published post, don't show notice.
		noticeMessage = __( 'Draft saved.' );
		isDraft = true;
	} else if ( isPublished && ! willPublish ) {
		// If undoing publish status, show specific notice.
		noticeMessage = postType.labels.item_reverted_to_draft;
		shouldShowLink = false;
	} else if ( ! isPublished && willPublish ) {
		// If publishing or scheduling a post, show the corresponding
		// publish message.
		noticeMessage = {
			publish: postType.labels.item_published,
			private: postType.labels.item_published_privately,
			future: postType.labels.item_scheduled,
		}[ post.status ];
	} else {
		// Generic fallback notice.
		noticeMessage = postType.labels.item_updated;
	}

	const actions = [];
	if ( shouldShowLink ) {
		actions.push( {
			label: isDraft ? __( 'View Preview' ) : postType.labels.view_item,
			url: post.link,
			openInNewTab: true,
		} );
	}
	return [
		noticeMessage,
		{
			id: 'editor-save',
			type: 'snackbar',
			actions,
		},
	];
}

/**
 * Builds the fail notification arguments for dispatch.
 *
 * @param {Object} data Incoming data to build the arguments with.
 *
 * @return {Array} Arguments for dispatch. An empty array signals no
 *                 notification should be sent.
 */
export function getNotificationArgumentsForSaveFail( data ) {
	const { post, edits, error } = data;
	if ( error && 'rest_autosave_no_changes' === error.code ) {
		// Autosave requested a new autosave, but there were no changes. This shouldn't
		// result in an error notice for the user.
		return [];
	}

	const publishStatus = [ 'publish', 'private', 'future' ];
	const isPublished = publishStatus.includes( post.status );

	// Handle offline error with specific messaging.
	if ( error.code === 'offline_error' ) {
		const messages = {
			publish: __(
				'Publishing failed because you were offline. Please verify your connection and try again.'
			),
			private: __(
				'Publishing failed because you were offline. Please verify your connection and try again.'
			),
			future: __(
				'Scheduling failed because you were offline. Please verify your connection and try again.'
			),
			default: __(
				'Updating failed because you were offline. Please verify your connection and try again.'
			),
		};

		const noticeMessage =
			! isPublished && edits.status in messages
				? messages[ edits.status ]
				: messages.default;

		return [ noticeMessage, { id: 'editor-save' } ];
	}

	// Handle request timeout errors.
	if ( error.code === 'request_timeout' ) {
		const messages = {
			publish: __(
				'Publishing timed out. Please try again or check your server performance.'
			),
			private: __(
				'Publishing timed out. Please try again or check your server performance.'
			),
			future: __(
				'Scheduling timed out. Please try again or check your server performance.'
			),
			default: __(
				'Updating timed out. Please try again or check your server performance.'
			),
		};

		const noticeMessage =
			! isPublished && edits.status in messages
				? messages[ edits.status ]
				: messages.default;

		return [ noticeMessage, { id: 'editor-save' } ];
	}

	// Handle HTTP errors with server-provided messages (like 500, 502, 503, 504).
	if ( error.code === 'http_error' && error.status ) {
		const serverErrorMessages = {
			500: __(
				'The server encountered an error while saving. Please try again or contact your hosting provider.'
			),
			502: __(
				'The server is temporarily unavailable. Please try again later.'
			),
			503: __(
				'The server is temporarily unavailable. Please try again later.'
			),
			504: __(
				'The server timed out while saving. Please try again or contact your hosting provider.'
			),
		};

		// Use server-provided message if available, otherwise use generic message.
		const noticeMessage =
			serverErrorMessages[ error.status ] ||
			__( 'An error occurred while saving. Please try again.' );

		return [ noticeMessage, { id: 'editor-save' } ];
	}

	// Handle authentication/session errors.
	if ( error.code === 'rest_cookie_invalid_nonce' ) {
		return [
			__(
				'Your session has expired. Please refresh the page and try again.'
			),
			{ id: 'editor-save' },
		];
	}

	// Handle invalid JSON responses (server returning HTML/error pages instead of JSON).
	if ( error.code === 'invalid_json' ) {
		return [
			__(
				'The server returned an invalid response. This may be caused by a server configuration issue or a PHP error. Check your server error logs.'
			),
			{ id: 'editor-save' },
		];
	}

	const messages = {
		publish: __( 'Publishing failed.' ),
		private: __( 'Publishing failed.' ),
		future: __( 'Scheduling failed.' ),
		default: __( 'Updating failed.' ),
	};

	let noticeMessage =
		! isPublished && edits.status in messages
			? messages[ edits.status ]
			: messages.default;

	// Check if message string contains HTML. Notice text is currently only
	// supported as plaintext, and stripping the tags may muddle the meaning.
	if ( error.message && ! /<\/?[^>]*>/.test( error.message ) ) {
		noticeMessage = [ noticeMessage, error.message ].join( ' ' );
	}
	return [
		noticeMessage,
		{
			id: 'editor-save',
		},
	];
}

/**
 * Builds the trash fail notification arguments for dispatch.
 *
 * @param {Object} data
 *
 * @return {Array} Arguments for dispatch.
 */
export function getNotificationArgumentsForTrashFail( data ) {
	return [
		data.error.message && data.error.code !== 'unknown_error'
			? data.error.message
			: __( 'Trashing failed' ),
		{
			id: 'editor-trash-fail',
		},
	];
}
