/** @format */
/**
 * External dependencies
 */
import { find, get, reduce } from 'lodash';

/**
 * Get the total tax for the discount value
 *
 * @param {Object} order An order as returned from API
 * @return {Float} Tax amount as a decimal number
 */
export function getOrderDiscountTax( order ) {
	const coupons = get( order, 'coupon_lines', [] );
	const tax = reduce( coupons, ( sum, value ) => sum + parseFloat( value.discount_tax ), 0 );
	return parseFloat( tax ) || 0;
}

/**
 * Get the total tax for a given line item's value
 *
 * @param {Object} order An order as returned from API
 * @param {Number} id The ID of the line_item
 * @return {Float} Tax amount as a decimal number
 */
export function getOrderLineItemTax( order, id ) {
	const items = get( order, 'line_items', [] );
	const tax = get( find( items, { id } ), 'taxes[0].total', 0 );
	return parseFloat( tax ) || 0;
}

/**
 * Get the total tax for the shipping value
 *
 * @param {Object} order An order as returned from API
 * @return {Float} Tax amount as a decimal number
 */
export function getOrderShippingTax( order ) {
	const tax = get( order, 'shipping_lines[0].taxes[0].total', 0 );
	return parseFloat( tax ) || 0;
}

/**
 * Get the total tax for the subtotal value (total of all line items)
 *
 * @param {Object} order An order as returned from API
 * @return {Float} Tax amount as a decimal number
 */
export function getOrderSubtotalTax( order ) {
	const items = get( order, 'line_items', [] );
	return reduce( items, ( sum, value ) => sum + getOrderLineItemTax( order, value.id ), 0 );
}

/**
 * Get the total tax for the total value
 *
 * @param {Object} order An order as returned from API
 * @return {Float} Tax amount as a decimal number
 */
export function getOrderTotalTax( order ) {
	const subtotal = getOrderSubtotalTax( order );
	const shipping = getOrderShippingTax( order );
	return subtotal + shipping;
}

/**
 * Get the refund value on a given order
 *
 * @param {Object} order An order as returned from API
 * @return {Float} The refund amount as a decimal number
 */
export function getOrderRefundTotal( order ) {
	const refunds = get( order, 'refunds', [] );
	return reduce( refunds, ( sum, value ) => sum + parseFloat( value.total ), 0 );
}
