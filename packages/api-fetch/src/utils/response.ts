/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Map of HTTP status codes to user-friendly error messages.
 */
const HTTP_STATUS_MESSAGES: Record< number, string > = {
	400: __( 'Bad request. Please check your input and try again.' ),
	401: __( 'Your session has expired. Please log in again.' ),
	403: __( 'You do not have permission to perform this action.' ),
	404: __( 'The requested resource was not found.' ),
	405: __( 'The request method is not allowed.' ),
	500: __( 'The server encountered an error. Please try again later.' ),
	502: __( 'The server is temporarily unavailable. Please try again later.' ),
	503: __( 'The server is temporarily unavailable. Please try again later.' ),
	504: __( 'The server timed out. Please try again.' ),
};

/**
 * Gets a user-friendly error message based on HTTP status code.
 *
 * @param status HTTP response status code.
 * @return Localized error message.
 */
function getHttpStatusMessage( status: number ): string | null {
	if ( status in HTTP_STATUS_MESSAGES ) {
		return HTTP_STATUS_MESSAGES[ status ];
	}
	return null;
}

/**
 * Calls the `json` function on the Response, throwing an error if the response
 * doesn't have a json function or if parsing the json itself fails.
 *
 * @param response
 * @return Parsed response.
 */
async function parseJsonAndNormalizeError( response: Response ) {
	try {
		return await response.json();
	} catch {
		// Try to get a more specific message from HTTP status.
		const httpMessage = getHttpStatusMessage( response.status );
		if ( httpMessage ) {
			throw {
				code: 'http_error',
				status: response.status,
				message: httpMessage,
			};
		}

		throw {
			code: 'invalid_json',
			message: __( 'The response is not a valid JSON response.' ),
		};
	}
}

/**
 * Parses the apiFetch response properly and normalize response errors.
 *
 * @param response
 * @param shouldParseResponse
 *
 * @return Parsed response.
 */
export async function parseResponseAndNormalizeError(
	response: Response,
	shouldParseResponse = true
) {
	if ( ! shouldParseResponse ) {
		return response;
	}

	if ( response.status === 204 ) {
		return null;
	}

	return await parseJsonAndNormalizeError( response );
}

/**
 * Parses a response, throwing an error if parsing the response fails.
 *
 * @param response
 * @param shouldParseResponse
 * @return Never returns, always throws.
 */
export async function parseAndThrowError(
	response: Response,
	shouldParseResponse = true
) {
	if ( ! shouldParseResponse ) {
		throw response;
	}

	// Parse the response JSON and throw it as an error.
	throw await parseJsonAndNormalizeError( response );
}
