/**
 * External dependencies
 *
 * @format
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Gridicon from 'gridicons';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';
import { flatMap, get, isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import ActivityLogItem from '../activity-log-item';
import Button from 'components/button';
import FoldableCard from 'components/foldable-card';
import { recordTracksEvent as recordTracksEventAction } from 'state/analytics/actions';
import { getRequestedRewind } from 'state/selectors';

/**
 * Module constants
 */
const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;

class ActivityLogDay extends Component {
	static propTypes = {
		applySiteOffset: PropTypes.func.isRequired,
		disableRestore: PropTypes.bool.isRequired,
		hideRestore: PropTypes.bool,
		isRewindActive: PropTypes.bool,
		logs: PropTypes.array.isRequired,
		requestedRestoreActivityId: PropTypes.string,
		requestRestore: PropTypes.func.isRequired,
		rewindConfirmDialog: PropTypes.element,
		siteId: PropTypes.number,
		tsEndOfSiteDay: PropTypes.number.isRequired,

		// Connected props
		isToday: PropTypes.bool.isRequired,
		recordTracksEvent: PropTypes.func.isRequired,
	};

	static defaultProps = {
		disableRestore: false,
		isRewindActive: true,
	};

	state = {
		rewindHere: false,
		dayExpanded: false,
	};

	componentWillReceiveProps( nextProps ) {
		// if Rewind dialog is being displayed and it's then canceled or a different Rewind button is clicked
		if (
			this.state.rewindHere &&
			( isEmpty( nextProps.requestedRewind ) ||
				this.props.requestedRewind !== nextProps.requestedRewind )
		) {
			this.setState( {
				rewindHere: false,
			} );
		}
	}

	handleClickRestore = event => {
		event.stopPropagation();
		this.setState( {
			rewindHere: true,
			dayExpanded: true,
		} );
		const { logs, requestRestore } = this.props;
		const lastLogId = get( logs, [ 0, 'activityId' ], null );
		if ( lastLogId ) {
			requestRestore( lastLogId, 'day' );
		}
	};

	trackOpenDay = () => {
		const { logs, moment, recordTracksEvent, tsEndOfSiteDay } = this.props;

		recordTracksEvent( 'calypso_activitylog_day_expand', {
			log_count: logs.length,
			ts_end_site_day: tsEndOfSiteDay,
			utc_date: moment.utc( tsEndOfSiteDay ).format( 'YYYY-MM-DD' ),
		} );

		this.setState( {
			dayExpanded: true,
		} );
	};

	handleCloseDay = () => this.setState( { dayExpanded: false } );

	/**
	 * Return a button to rewind to this point.
	 *
	 * @param {string} type Whether the button will be a primary or not.
	 * @returns { object } Button to display.
	 */
	renderRewindButton( type = '' ) {
		const { disableRestore, hideRestore, isToday } = this.props;

		if ( hideRestore || isToday ) {
			return null;
		}

		return (
			<Button
				className="activity-log-day__rewind-button"
				compact
				disabled={ disableRestore || ! this.props.isRewindActive || this.state.rewindHere }
				onClick={ this.handleClickRestore }
				primary={ 'primary' === type }
			>
				<Gridicon icon="history" size={ 18 } />{' '}
				{ this.props.translate( 'Rewind {{em}}to this day{{/em}}', {
					components: { em: <em /> },
				} ) }
			</Button>
		);
	}

	/**
	 * Return a heading that serves as parent for many events.
	 *
	 * @returns { object } Heading to display with date and number of events
	 */
	renderEventsHeading() {
		const { applySiteOffset, isToday, logs, moment, translate, tsEndOfSiteDay } = this.props;

		const formattedDate = applySiteOffset( moment.utc( tsEndOfSiteDay ) ).format( 'LL' );
		const noActivityText = isToday ? translate( 'No activity yet!' ) : translate( 'No activity' );

		return (
			<div>
				<div className="activity-log-day__day">
					{ isToday ? (
						translate( '%s — Today', {
							args: formattedDate,
							comment: 'Long date with today indicator, i.e. "January 1, 2017 — Today"',
						} )
					) : (
						formattedDate
					) }
				</div>
				<div className="activity-log-day__events">
					{ isEmpty( logs ) ? (
						noActivityText
					) : (
						translate( '%d Event', '%d Events', {
							args: logs.length,
							count: logs.length,
						} )
					) }
				</div>
			</div>
		);
	}

	render() {
		const {
			applySiteOffset,
			disableRestore,
			hideRestore,
			isToday,
			logs,
			requestedRestoreActivityId,
			requestRestore,
			rewindConfirmDialog,
			siteId,
		} = this.props;

		const hasLogs = ! isEmpty( logs ),
			dayExpanded = this.state.dayExpanded ? true : this.state.rewindHere;

		return (
			<div className={ classnames( 'activity-log-day', { 'is-empty': ! hasLogs } ) }>
				<FoldableCard
					clickableHeader={ hasLogs }
					expanded={ hasLogs && ( isToday || dayExpanded ) }
					expandedSummary={ hasLogs ? this.renderRewindButton() : null }
					header={ this.renderEventsHeading() }
					onOpen={ this.trackOpenDay }
					onClose={ this.handleCloseDay }
					summary={ hasLogs ? this.renderRewindButton( 'primary' ) : null }
				>
					{ hasLogs &&
						flatMap( logs, log => [
							log.activityId === requestedRestoreActivityId && rewindConfirmDialog,
							<ActivityLogItem
								applySiteOffset={ applySiteOffset }
								disableRestore={ disableRestore }
								hideRestore={ hideRestore }
								key={ log.activityId }
								log={ log }
								requestRestore={ requestRestore }
								siteId={ siteId }
							/>,
						] ) }
				</FoldableCard>
			</div>
		);
	}
}

export default connect(
	( state, { tsEndOfSiteDay, siteId } ) => {
		const now = Date.now();
		return {
			isToday: now <= tsEndOfSiteDay && tsEndOfSiteDay - DAY_IN_MILLISECONDS <= now,
			requestedRewind: getRequestedRewind( state, siteId ),
		};
	},
	{
		recordTracksEvent: recordTracksEventAction,
	}
)( localize( ActivityLogDay ) );
