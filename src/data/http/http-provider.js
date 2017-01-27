import xhr from 'xhr';
import utils from '../../utils';
import formUrlencoded from 'form-urlencoded';
import AuthStrategy from '../auth-strategy';

class HttpProvider {
  constructor(baseUri, authStrategy) {
    this.baseUri = baseUri || '';
    this.authStrategy = authStrategy;
  }

  getJson(path, queryParameters, options) {
    if (queryParameters) {
      path += '?' + utils.encodeQueryString(queryParameters);
    }

    return this._createRequest({
      method: 'GET',
      path: path,
      json: true,
      ...options
    });
  }

  postJson(path, data, options) {
    return this._createRequest({
      method: 'POST',
      path: path,
      body: data,
      json: true,
      ...options
    });
  }

  postForm(path, data, options) {
    return this._createRequest({
      method: 'POST',
      path: path,
      body: formUrlencoded(data),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      ...options
    });
  }

  _tryParseJson(data) {
    try {
      return JSON.parse(data);
    } catch (otherErr) {
      return false;
    }
  }

  _createResponseError(err) {
    if (!err) {
      return this._createResponseError('Unknown error.');
    }

    let type;
    let message;
    let status;

    if (typeof err === 'string') {
      const parsedError = this._tryParseJson(err);
      if (parsedError) {
        err = parsedError;
      }
    }

    if (err && typeof err === 'object') {
      status = err.status ? err.status : undefined;
      type = err.type ? err.type : 'unknown';
      message = err.message ? err.message : JSON.stringify(err);
    } else {
      type = 'unknown';
      message = err || 'Unknown error';
    }

    const newError = new Error(message);

    newError.status = status;
    newError.type = type;

    return newError;
  }

  _needsPreflight(options) {
    if (!options || this.authStrategy === AuthStrategy.Cookie) {
      return false;
    }

    const headers = options.headers;
    if (headers && headers['Authorization']) {
      return true;
    }

    if (options.method === 'POST' && options.json) {
      return true;
    }

    return false;
  }

  _createRequest(options) {
    options.uri = this.baseUri + options.path;
    options.headers = options.headers || {};

    if (this._needsPreflight(options)) {
      options.headers['X-Stormpath-Agent'] = `${pkg.name}/${pkg.version}`;
    }

    return new Promise((accept, reject) => {
      xhr(options, (err, resp, body) => {
        if (err) {
          if (resp && resp.statusCode === 0) {
            err = 'Communication error. Check the API configuration option and allowed origins on your application.';
          }

          return reject(this._createResponseError(err));
        }

        if (resp && resp.statusCode >= 400) {
          return reject(this._createResponseError(body && body.error || body));
        }

        if (typeof body === 'string') {
          const parsedBody = this._tryParseJson(body);
          if (parsedBody !== false) {
            body = parsedBody;
          }
        }

        accept(body);
      });
    });
  }
}

export default HttpProvider;
