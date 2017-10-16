/** @format */
/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { cancellationEffectDetail, cancellationEffectHeadline } from '../cancellation-effect';
import { JETPACK_PLANS } from 'lib/plans/constants';
import { isTheme, isGoogleApps, isJetpackPlan, isDomainMapping } from 'lib/products-values';
import purchases from 'lib/purchases';

jest.mock( 'lib/products-values', () => ( {} ) );
jest.mock( 'lib/purchases', () => ( {} ) );

describe( 'cancellation-effect', () => {
	const purchase = { domain: 'example.com' };
	let translate;

	beforeEach( () => {
		purchases.getName = () => 'purchase name';
		translate = ( text, args ) => ( { args, text } );
	} );

	describe( 'cancellationEffectHeadline', () => {
		describe( 'when refundable', () => {
			beforeEach( () => {
				purchases.isRefundable = () => true;
			} );

			test( 'should return translation of cancel and return', () => {
				const headline = cancellationEffectHeadline( purchase, translate );
				expect( headline.text ).to.equal(
					'Are you sure you want to cancel and remove %(purchaseName)s from {{em}}%(domain)s{{/em}}? '
				);
			} );
		} );

		describe( 'when not refundable', () => {
			beforeEach( () => {
				purchases.isRefundable = () => false;
			} );

			test( 'should return translation of cancel', () => {
				const headline = cancellationEffectHeadline( purchase, translate );
				expect( headline.text ).to.equal(
					'Are you sure you want to cancel %(purchaseName)s for {{em}}%(domain)s{{/em}}? '
				);
			} );
		} );
	} );

	describe( 'cancellationEffectDetail', () => {
		describe( 'when refundable', () => {
			beforeEach( () => {
				purchases.isRefundable = () => true;
			} );

			test( 'should return translation of theme message when product is a theme', () => {
				// isTheme = () => true;
				const headline = cancellationEffectDetail(
					{
						domain: 'example.com',
						product_slug: 'premium_theme',
					},
					translate
				);
				expect( headline.text ).to.equal(
					"Your site's appearance will revert to its previously selected theme and you will be refunded %(cost)s."
				);
			} );

			test( 'should return translation of g suite message when product is g suite', () => {
				// isTheme = () => false;
				// isGoogleApps = () => true;
				const headline = cancellationEffectDetail(
					{
						domain: 'example.com',
						product_slug: 'gapps',
					},
					translate
				);
				expect( headline.text ).to.equal(
					'You will be refunded %(cost)s, but your G Suite account will continue working without interruption. ' +
						'You will be able to manage your G Suite billing directly through Google.'
				);
			} );

			test( 'should return translation of jetpack plan message when product is a jetpack plan', () => {
				// isTheme = () => false;
				// isGoogleApps = () => false;
				// isJetpackPlan = () => true;
				const headline = cancellationEffectDetail(
					{
						domain: 'example.com',
						product_slug: JETPACK_PLANS[ 0 ],
					},
					translate
				);
				expect( headline.text ).to.equal(
					'All plan features - spam filtering, backups, and security screening ' +
						'- will be removed from your site and you will be refunded %(cost)s.'
				);
			} );

			test( 'should return translation of plan message when product is not a theme, g suite or a jetpack plan', () => {
				// isTheme = () => false;
				// isGoogleApps = () => false;
				// isJetpackPlan = () => false;
				const headline = cancellationEffectDetail(
					{
						domain: 'example.com',
						product_slug: 'something-completely-ridiculous',
					},
					translate
				);
				expect( headline.text ).to.equal(
					'All plan features and custom changes will be removed from your site and you will be refunded %(cost)s.'
				);
			} );
		} );

		describe( 'when not refundable', () => {
			beforeEach( () => {
				purchases.isRefundable = () => false;
				purchases.getSubscriptionEndDate = () => '15/12/2093';
			} );

			test( 'should return translation of g suite message when product is g suite', () => {
				// isGoogleApps = () => true;
				const headline = cancellationEffectDetail(
					{
						domain: 'example.com',
						product_slug: 'gapps',
					},
					translate
				);
				expect( headline.text ).to.equal(
					'Your G Suite account remains active until it expires on %(subscriptionEndDate)s.'
				);
			} );

			test( 'should return translation of domain mapping message when product is a domain mapping', () => {
				// isGoogleApps = () => false;
				// isDomainMapping = () => true;
				const headline = cancellationEffectDetail(
					{
						domain: 'example.com',
						product_slug: 'domain_map',
					},
					translate
				);
				expect( headline.text ).to.equal(
					'Your domain mapping remains active until it expires on %(subscriptionEndDate)s.'
				);
			} );

			test( 'should return translation of plan message when product is not g suite or a domain mapping', () => {
				// isGoogleApps = () => false;
				// isDomainMapping = () => false;
				const headline = cancellationEffectDetail(
					{
						domain: 'example.com',
						product_slug: 'something-completely-ridiculous',
					},
					translate
				);
				expect( headline.text ).to.equal(
					"Your plan's features remain active until your subscription expires on %(subscriptionEndDate)s."
				);
			} );
		} );
	} );
} );
