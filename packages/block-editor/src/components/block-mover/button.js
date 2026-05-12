/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { Button } from '@wordpress/components';
import { VisuallyHidden } from '@wordpress/ui';
import { useInstanceId, useViewportMatch } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { forwardRef, useMemo } from '@wordpress/element';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import { displayShortcut } from '@wordpress/keycodes';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import {
	chevronLeft,
	chevronRight,
	chevronUp,
	chevronDown,
} from '@wordpress/icons';
import { getBlockMoverDescription } from './mover-description';
import { store as blockEditorStore } from '../../store';

const getArrowIcon = ( direction, orientation ) => {
	if ( direction === 'up' ) {
		if ( orientation === 'horizontal' ) {
			return isRTL() ? chevronRight : chevronLeft;
		}
		return chevronUp;
	} else if ( direction === 'down' ) {
		if ( orientation === 'horizontal' ) {
			return isRTL() ? chevronLeft : chevronRight;
		}
		return chevronDown;
	}
	return null;
};

const getMovementDirectionLabel = ( moveDirection, orientation ) => {
	if ( moveDirection === 'up' ) {
		if ( orientation === 'horizontal' ) {
			return isRTL() ? __( 'Move right' ) : __( 'Move left' );
		}
		return __( 'Move up' );
	} else if ( moveDirection === 'down' ) {
		if ( orientation === 'horizontal' ) {
			return isRTL() ? __( 'Move left' ) : __( 'Move right' );
		}
		return __( 'Move down' );
	}
	return null;
};

/**
 * Generate announcement message for screen readers after block move.
 *
 * @param {number}  blocksCount  Number of blocks moved.
 * @param {string}  blockType   Block type name.
 * @param {number}  newIndex   New position index after move.
 * @param {string} direction  Direction moved ('up' or 'down').
 * @param {string} orientation Block list orientation.
 * @return {string} Announce message for screen readers.
 */
const getBlockMovedAnnouncement = (
	blocksCount,
	blockType,
	newIndex,
	direction,
	orientation
) => {
	const position = newIndex + 1;
	const movementDir = getMovementDirectionFn( direction, orientation );
	const dirLabel = movementDir === 'up' ? __( 'up' ) : __( 'down' );

	if ( blocksCount === 1 ) {
		return sprintf(
			// translators: 1: Block type, 2: New position, 3: Direction (up/down)
			__( '%1$s block moved to position %2$d, %3$s' ),
			blockType,
			position,
			dirLabel
		);
	}

	return sprintf(
		// translators: 1: Number of blocks, 2: New position, 3: Direction (up/down)
		__( '%1$d blocks moved to position %2$d, %3$s' ),
		blocksCount,
		position,
		dirLabel
	);
};

const getMovementDirectionFn = ( moveDirection, orientation ) => {
	if ( moveDirection === 'up' ) {
		if ( orientation === 'horizontal' ) {
			return isRTL() ? 'right' : 'left';
		}
		return 'up';
	} else if ( moveDirection === 'down' ) {
		if ( orientation === 'horizontal' ) {
			return isRTL() ? 'left' : 'right';
		}
		return 'down';
	}
	return null;
};

const BlockMoverButton = forwardRef(
	(
		{ clientIds, direction, orientation: moverOrientation, ...props },
		ref
	) => {
		const instanceId = useInstanceId( BlockMoverButton );
		const normalizedClientIds = useMemo(
			() => ( Array.isArray( clientIds ) ? clientIds : [ clientIds ] ),
			[ clientIds ]
		);
		const blocksCount = normalizedClientIds.length;
		const isMobileViewport = useViewportMatch( 'small', '<' );

		const {
			blockType,
			isDisabled,
			rootClientId,
			isFirst,
			isLast,
			firstIndex,
			orientation = 'vertical',
		} = useSelect(
			( select ) => {
				const {
					getBlockIndex,
					getBlockRootClientId,
					getBlockOrder,
					getBlock,
					getBlockListSettings,
				} = select( blockEditorStore );
				const firstClientId = normalizedClientIds[ 0 ];
				const blockRootClientId = getBlockRootClientId( firstClientId );
				const firstBlockIndex = getBlockIndex( firstClientId );
				const lastBlockIndex = getBlockIndex(
					normalizedClientIds[ normalizedClientIds.length - 1 ]
				);
				const blockOrder = getBlockOrder( blockRootClientId );
				const block = getBlock( firstClientId );
				const isFirstBlock = firstBlockIndex === 0;
				const isLastBlock = lastBlockIndex === blockOrder.length - 1;
				const { orientation: blockListOrientation } =
					getBlockListSettings( blockRootClientId ) || {};

				return {
					blockType: block ? getBlockType( block.name ) : null,
					isDisabled: direction === 'up' ? isFirstBlock : isLastBlock,
					rootClientId: blockRootClientId,
					firstIndex: firstBlockIndex,
					isFirst: isFirstBlock,
					isLast: isLastBlock,
					orientation: moverOrientation || blockListOrientation,
				};
			},
			[ direction, moverOrientation, normalizedClientIds ]
		);

		const { moveBlocksDown, moveBlocksUp } =
			useDispatch( blockEditorStore );
		const moverFunction =
			direction === 'up' ? moveBlocksUp : moveBlocksDown;

		const onClick = ( event ) => {
			// Execute the move.
			moverFunction( clientIds, rootClientId );

			// Announce the move to screen readers using ARIA live region.
			// Get the new index after move (optimistic - assume move succeeded).
			const newIndex =
				direction === 'up'
					? Math.max( 0, firstIndex - 1 )
					: firstIndex + 1;
			const announcement = getBlockMovedAnnouncement(
				blocksCount,
				blockType && blockType.title,
				newIndex,
				direction,
				orientation
			);
			speak( announcement, 'polite' );

			if ( props.onClick ) {
				props.onClick( event );
			}
		};

		const descriptionId = `block-editor-block-mover-button__description-${ instanceId }`;

		return (
			<>
				<Button
					__next40pxDefaultSize
					ref={ ref }
					className={ clsx(
						'block-editor-block-mover-button',
						`is-${ direction }-button`
					) }
					icon={ getArrowIcon( direction, orientation ) }
					label={ getMovementDirectionLabel(
						direction,
						orientation
					) }
					tooltipPosition={
						! isMobileViewport &&
						direction === 'down' &&
						orientation === 'vertical'
							? 'bottom'
							: 'top'
					}
					aria-describedby={ descriptionId }
					{ ...props }
					onClick={ isDisabled ? null : onClick }
					disabled={ isDisabled }
					accessibleWhenDisabled
					shortcut={
						direction === 'up'
							? displayShortcut.secondary( 't' )
							: displayShortcut.secondary( 'y' )
					}
				/>
				<VisuallyHidden id={ descriptionId }>
					{ getBlockMoverDescription(
						blocksCount,
						blockType && blockType.title,
						firstIndex,
						isFirst,
						isLast,
						direction === 'up' ? -1 : 1,
						orientation
					) }
				</VisuallyHidden>
			</>
		);
	}
);

export const BlockMoverUpButton = forwardRef( ( props, ref ) => {
	return <BlockMoverButton direction="up" ref={ ref } { ...props } />;
} );

export const BlockMoverDownButton = forwardRef( ( props, ref ) => {
	return <BlockMoverButton direction="down" ref={ ref } { ...props } />;
} );
