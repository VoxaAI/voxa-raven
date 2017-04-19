'use strict';

const expect = require('chai').expect;
const _ = require('lodash');
const simple = require('simple-mock');
const Voxa = require('voxa');
const Raven = require('raven');
const ravenPlugin = require('../');

describe('Raven plugin', () => {
  let states;
  let event;
  let client;
  let spy;

  beforeEach(() => {
    simple.restore();

    client = new Raven.Client('https://something:something@example.com').install();
    spy = simple.mock(client, 'send')
     .callbackWith(null, 'error id');

    event = {
      request: {
        type: 'IntentRequest',

      },
    };
    states = {
      firstState: () => ({ to: 'secondState' }),
      secondState: () => ({ to: 'thirdState' }),
      thirdState: () => ({ to: 'entry' }),
    };
  });

  it('should capture state changes in breadcrumbs', () => {
    const skill = new Voxa({ views: { } });
    states.entry = () => {
      throw new Error('Breadcrumbs!');
    };
    _.map(states, (state, name) => {
      skill.onState(name, state);
    });

    event.session = {
      attributes: {
        state: 'firstState',
      },
    };
    ravenPlugin(skill, client);

    return skill.execute(event)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(spy.callCount).to.equal(1);
        expect(spy.lastCall.args[0].message).to.equal('Error: Breadcrumbs!');
        // console.dir(client);
        expect(_.map(spy.lastCall.args[0].breadcrumbs.values, 'data')).to.deep.equal([
          { currentState: 'firstState' },
          { currentState: 'secondState' },
          { currentState: 'thirdState' },
          { currentState: 'entry' },
        ]);

        expect(reply.msg.statements[0]).to.equal('An unrecoverable error occurred.');
      });
  });

  it('should have the client available in the request object', () => {
    const skill = new Voxa({ views: { hi: { tell: 'hi!' } } });
    states.entry = request => request.raven.captureMessageAsync('Some message')
        .then(() => ({ reply: 'hi' }));

    _.map(states, (state, name) => {
      skill.onState(name, state);
    });
    ravenPlugin(skill, client);
    return skill.execute(event)
      .then(() => {
        expect(spy.called).to.be.true;
        expect(spy.callCount).to.equal(1);
        expect(spy.lastCall.args[0].message).to.equal('Some message');
      });
  });

  it('should send an exception to sentry', () => {
    const skill = new Voxa({ views: { } });
    states.entry = () => {
      throw new Error('Exception!');
    };

    _.map(states, (state, name) => {
      skill.onState(name, state);
    });

    ravenPlugin(skill, client);

    return skill.execute(event)
      .then((reply) => {
        expect(spy.called).to.be.true;
        expect(spy.callCount).to.equal(1);
        expect(spy.lastCall.args[0].message).to.equal('Error: Exception!');

        expect(reply.msg.statements[0]).to.equal('An unrecoverable error occurred.');
      });
  });
});
