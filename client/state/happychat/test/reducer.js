/** @format */

/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { lastActivityTimestamp, lostFocusAt } from '../reducer';
import {
	HAPPYCHAT_RECEIVE_EVENT,
	HAPPYCHAT_BLUR,
	HAPPYCHAT_FOCUS,
	HAPPYCHAT_IO_SEND_MESSAGE_MESSAGE,
	SERIALIZE,
} from 'state/action-types';
import { useSandbox } from 'test/helpers/use-sinon';

// Simulate the time Feb 27, 2017 05:25 UTC
const NOW = 1488173100125;

describe( 'reducers', () => {
	describe( '#lastActivityTimestamp', () => {
		useSandbox( sandbox => {
			sandbox.stub( Date, 'now' ).returns( NOW );
		} );

		test( 'defaults to null', () => {
			const result = lastActivityTimestamp( undefined, {} );
			expect( result ).to.be.null;
		} );

		test( 'should update on certain activity-specific actions', () => {
			let result;

			result = lastActivityTimestamp( null, { type: HAPPYCHAT_RECEIVE_EVENT } );
			expect( result ).to.equal( NOW );

			result = lastActivityTimestamp( null, { type: HAPPYCHAT_IO_SEND_MESSAGE_MESSAGE } );
			expect( result ).to.equal( NOW );
		} );
	} );

	describe( '#lostFocusAt', () => {
		useSandbox( sandbox => {
			sandbox.stub( Date, 'now' ).returns( NOW );
		} );

		test( 'defaults to null', () => {
			expect( lostFocusAt( undefined, {} ) ).to.be.null;
		} );

		test( 'SERIALIZEs to Date.now() if state is null', () => {
			expect( lostFocusAt( null, { type: SERIALIZE } ) ).to.eql( NOW );
		} );

		test( 'returns Date.now() on HAPPYCHAT_BLUR actions', () => {
			expect( lostFocusAt( null, { type: HAPPYCHAT_BLUR } ) ).to.eql( NOW );
		} );

		test( 'returns null on HAPPYCHAT_FOCUS actions', () => {
			expect( lostFocusAt( 12345, { type: HAPPYCHAT_FOCUS } ) ).to.be.null;
		} );
	} );
} );
