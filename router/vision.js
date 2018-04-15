// The exported functions in this module makes a call to Microsoft Cognitive Service Computer Vision API and return caption
// description if found. Note: you can do more advanced functionalities like checking
// the confidence score of the caption. For more info checkout the API documentation:
// https://www.microsoft.com/cognitive-services/en-us/Computer-Vision-API/documentation/AnalyzeImage

const request = require('request').defaults({ encoding: null });
const needle = require('needle');

/**
 *  Gets the caption of the image from an image stream
 * @param {stream} stream The stream to an image.
 * @return {Promise} Promise with caption string if succeeded, error otherwise
 */
exports.getCaptionFromStream = function (stream) {
    var apiUrl = process.env.MICROSOFT_VISION_API_ENDPOINT + '/analyze?visualFeatures=Description'
    return new Promise(
        function (resolve, reject) {
            var requestData = {
                url: apiUrl,
                encoding: 'binary',
                json: true,
                headers: {
                    'Ocp-Apim-Subscription-Key': process.env.MICROSOFT_VISION_API_KEY,
                    'content-type': 'application/octet-stream'
                }
            };

            stream.pipe(request.post(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                } else if (response.statusCode !== 200) {
                    reject(body);
                } else {
                    resolve(extractCaption(body));
                }
            }));
        }
    );
};

/**
 * Gets the caption of the image from an image URL
 * @param {string} url The URL to an image.
 * @return {Promise} Promise with caption string if succeeded, error otherwise
 */
exports.getCaptionFromUrl = function (url) {
    var apiUrl = process.env.MICROSOFT_VISION_API_ENDPOINT + '/analyze?visualFeatures=Description'
    return new Promise(
        function (resolve, reject) {
            var requestData = {
                url: apiUrl,
                json: { 'url': url },
                headers: {
                    'Ocp-Apim-Subscription-Key': process.env.MICROSOFT_VISION_API_KEY,
                    'content-type': 'application/json'
                }
            };

            request.post(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode !== 200) {
                    reject(body);
                }
                else {
                    resolve(extractCaption(body));
                }
            });
        }
    );
};

/**
 * Extracts the caption description from the response of the Vision API
 * @param {Object} body Response of the Vision API
 * @return {string} Description if caption found, null otherwise.
 */
exports.extractCaption = function (body) {
  let predictions = (body && body.Predictions) ? body.Predictions : [];

  let name = (predictions.length > 0) ? predictions[0].Tag : '';

  return name;
}

exports.getImageStreamFromMessage = function (message) {
  var headers = {};
  var attachment = message.attachments[0];

  headers['Content-Type'] = attachment.contentType;
  return needle.get(attachment.contentUrl, { headers: headers });
}