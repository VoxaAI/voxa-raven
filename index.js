'use strict';

const Promise = require('bluebird');
const debug = require('debug')('voxa:raven');
const _ = require('lodash');

function register(skill, ravenClient) {
  const execute = skill.execute;
  const client = Promise.promisifyAll(ravenClient);

  skill.execute = client.wrap(execute);

  skill.onRequestStarted((request) => {
    const fromState = request.session.new ? 'entry' : request.session.attributes.state || 'entry';
    client.mergeContext({
      extra: { request: _.cloneDeep(request) },
    });
    client.captureBreadcrumb({
      message: 'Start state',
      category: 'stateFlow',
      data: {
        currentState: fromState,
      },
    });

    request.raven = client;
  });

  skill.onAfterStateChanged((request, reply, transition) => {
    debug('captureBreadcrumb', transition.to);
    client.captureBreadcrumb({
      message: 'State changed',
      category: 'stateFlow',
      data: {
        currentState: transition.to,
      },
    });
  });

  skill.onStateMachineError((request, reply, error) => client.captureExceptionAsync(error)
    .then((eventId) => {
      debug('Captured exception and sent to Sentry successfully with eventId: %s', eventId);
      request.ravenErrorReported = true;
    }));

  skill.onError((request, error) => {
    if (request.ravenErrorReported) {
      return null;
    }

    return ravenClient.captureExceptionAsync(error)
      .then((eventId) => {
        debug('Captured exception and sent to Sentry successfully with eventId: %s', eventId);
      });
  });
}

module.exports = register;

