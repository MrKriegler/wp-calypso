/**
 * External dependencies
 *
 * @format
 */

import { concat, filter, find, map, get, sortBy, takeRight } from 'lodash';
import validator from 'is-my-json-valid';

/**
 * Internal dependencies
 */
import {
	SERIALIZE,
	DESERIALIZE,
	HAPPYCHAT_BLUR,
	HAPPYCHAT_FOCUS,
	HAPPYCHAT_IO_RECEIVE_MESSAGE,
	HAPPYCHAT_IO_RECEIVE_STATUS,
	HAPPYCHAT_IO_REQUEST_TRANSCRIPT_RECEIVE,
	HAPPYCHAT_IO_REQUEST_TRANSCRIPT_TIMEOUT,
	HAPPYCHAT_IO_SEND_MESSAGE_MESSAGE,
} from 'state/action-types';
import { combineReducers, isValidStateWithSchema } from 'state/utils';
import { HAPPYCHAT_CHAT_STATUS_DEFAULT } from './selectors';
import { HAPPYCHAT_MAX_STORED_MESSAGES } from './constants';
import { timelineSchema } from './schema';
import user from './user/reducer';
import connection from './connection/reducer';

/**
 * Returns a timeline event from the redux action
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Action payload
 * @return {Object}        Updated state
 *
 */
const timeline_event = ( state = {}, action ) => {
	switch ( action.type ) {
		case HAPPYCHAT_IO_RECEIVE_MESSAGE:
			const msg = action.message;
			return Object.assign(
				{},
				{
					id: msg.id,
					source: msg.source,
					message: msg.text,
					name: msg.user.name,
					image: msg.user.avatarURL,
					timestamp: msg.timestamp,
					user_id: msg.user.id,
					type: get( msg, 'type', 'message' ),
					links: get( msg, 'meta.links' ),
				}
			);
	}
	return state;
};

const validateTimeline = validator( timelineSchema );
const sortTimeline = timeline => sortBy( timeline, event => parseInt( event.timestamp, 10 ) );

/**
 * Adds timeline events for happychat
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Action payload
 * @return {Object}        Updated state
 *
 */
const timeline = ( state = [], action ) => {
	switch ( action.type ) {
		case SERIALIZE:
			return takeRight( state, HAPPYCHAT_MAX_STORED_MESSAGES );
		case DESERIALIZE:
			const valid = validateTimeline( state );
			if ( valid ) {
				return state;
			}
			return [];
		case HAPPYCHAT_IO_RECEIVE_MESSAGE:
			// if meta.forOperator is set, skip so won't show to user
			if ( get( action, 'message.meta.forOperator', false ) ) {
				return state;
			}
			const event = timeline_event( {}, action );
			const existing = find( state, ( { id } ) => event.id === id );
			return existing ? state : concat( state, [ event ] );
		case HAPPYCHAT_IO_REQUEST_TRANSCRIPT_TIMEOUT:
			return [];
		case HAPPYCHAT_IO_REQUEST_TRANSCRIPT_RECEIVE:
			const messages = filter( action.messages, message => {
				if ( ! message.id ) {
					return false;
				}

				// if meta.forOperator is set, skip so won't show to user
				if ( get( message, 'meta.forOperator', false ) ) {
					return false;
				}

				return ! find( state, { id: message.id } );
			} );
			return sortTimeline(
				state.concat(
					map( messages, message => {
						return Object.assign( {
							id: message.id,
							source: message.source,
							message: message.text,
							name: message.user.name,
							image: message.user.picture,
							timestamp: message.timestamp,
							user_id: message.user.id,
							type: get( message, 'type', 'message' ),
							links: get( message, 'meta.links' ),
						} );
					} )
				)
			);
	}
	return state;
};
timeline.hasCustomPersistence = true;

/**
 * Tracks the state of the happychat chat. Valid states are:
 *
 *  - HAPPYCHAT_CHAT_STATUS_DEFAULT : no chat has been started
 *  - HAPPYCHAT_CHAT_STATUS_PENDING : chat has been started but no operator assigned
 *  - HAPPYCHAT_CHAT_STATUS_ASSIGNING : system is assigning to an operator
 *  - HAPPYCHAT_CHAT_STATUS_ASSIGNED : operator has been connected to the chat
 *  - HAPPYCHAT_CHAT_STATUS_MISSED : no operator could be assigned
 *  - HAPPYCHAT_CHAT_STATUS_ABANDONED : operator was disconnected
 *  - HAPPYCHAT_CHAT_STATUS_CLOSED : chat was closed
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Action payload
 * @return {Object}        Updated state
 *
 */
const chatStatus = ( state = HAPPYCHAT_CHAT_STATUS_DEFAULT, action ) => {
	switch ( action.type ) {
		case HAPPYCHAT_IO_RECEIVE_STATUS:
			return action.status;
	}
	return state;
};

export const lastActivityTimestamp = ( state = null, action ) => {
	switch ( action.type ) {
		case HAPPYCHAT_IO_SEND_MESSAGE_MESSAGE:
		case HAPPYCHAT_IO_RECEIVE_MESSAGE:
			return Date.now();
	}
	return state;
};
lastActivityTimestamp.schema = { type: 'number' };

/**
 * Tracks the last time Happychat had focus. This lets us determine things like
 * whether the user has unread messages. A numerical value is the timestamp where focus
 * was lost, and `null` means HC currently has focus.
 *
 * @param  {Object} state  Current state
 * @param  {Object} action Action payload
 * @return {Object}        Updated state
 */
export const lostFocusAt = ( state = null, action ) => {
	switch ( action.type ) {
		case SERIALIZE:
			// If there's already a timestamp set, use that. Otherwise treat a SERIALIZE as a
			// "loss of focus" since it represents the state when the browser (and HC) closed.
			if ( state === null ) {
				return Date.now();
			}
			return state;
		case DESERIALIZE:
			if ( isValidStateWithSchema( state, { type: 'number' } ) ) {
				return state;
			}
			return null;
		case HAPPYCHAT_BLUR:
			return Date.now();
		case HAPPYCHAT_FOCUS:
			return null;
	}
	return state;
};
lastActivityTimestamp.hasCustomPersistence = true;

export default combineReducers( {
	chatStatus,
	lastActivityTimestamp,
	lostFocusAt,
	timeline,
	user,
	connection,
} );
