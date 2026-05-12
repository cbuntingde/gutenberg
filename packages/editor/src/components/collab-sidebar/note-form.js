/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect } from '@wordpress/element';
import {
	__experimentalTruncate as Truncate,
	Button,
} from '@wordpress/components';
import { Stack, VisuallyHidden } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
import { isKeyboardEvent } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { sanitizeNoteContent } from './utils';

export function NoteForm( { onSubmit, onCancel, note, labels, autoFocus: shouldAutoFocus } ) {
	const [ inputComment, setInputComment ] = useState(
		note?.content?.raw ?? ''
	);

	const inputId = useInstanceId( NoteForm, 'comment-input' );
	const textareaRef = useRef( null );
	const isDisabled =
		inputComment === note?.content?.raw ||
		! sanitizeNoteContent( inputComment ).length;

	// Auto-focus the textarea when the form is displayed (for keyboard accessibility).
	// This allows keyboard users to immediately start typing without needing to manually focus the textarea.
	useEffect( () => {
		if ( shouldAutoFocus && textareaRef.current ) {
			textareaRef.current.focus();
		}
	}, [ shouldAutoFocus ] );

	return (
		<Stack
			className="editor-collab-sidebar-panel__note-form"
			direction="column"
			gap="lg"
			render={ <form /> }
			onSubmit={ ( event ) => {
				event.preventDefault();
				onSubmit( inputComment );
				setInputComment( '' );
			} }
		>
			{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control */ }
			<VisuallyHidden render={ <label htmlFor={ inputId } /> }>
				{ labels?.input ?? __( 'Note' ) }
			</VisuallyHidden>
			<TextareaAutosize
				ref={ textareaRef }
				id={ inputId }
				value={ inputComment ?? '' }
				onChange={ ( comment ) =>
					setInputComment( comment.target.value )
				}
				rows={ 1 }
				maxRows={ 20 }
				onKeyDown={ ( event ) => {
					if (
						isKeyboardEvent.primary( event, 'Enter' ) &&
						! isDisabled
					) {
						event.target.parentNode.requestSubmit();
					}

					if ( event.key === 'Escape' ) {
						event.preventDefault();
						// Passing event for reply forms.
						onCancel( event );
					}
				} }
				// AutoFocus is handled via useEffect for better browser support.
				// eslint-disable-next-line jsx-a11y/no-autofocus
				autoFocus={ shouldAutoFocus }
			/>
			<Stack
				direction="row"
				align="center"
				justify="flex-end"
				gap="sm"
				wrap="wrap"
			>
				<Button size="compact" variant="tertiary" onClick={ onCancel }>
					<Truncate>{ __( 'Cancel' ) }</Truncate>
				</Button>
				<Button
					size="compact"
					accessibleWhenDisabled
					variant="primary"
					type="submit"
					disabled={ isDisabled }
				>
					<Truncate>{ labels?.submit ?? __( 'Add note' ) }</Truncate>
				</Button>
			</Stack>
		</Stack>
	);
}
