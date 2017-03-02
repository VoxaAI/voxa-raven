Voxa Raven
===========

[![Build Status](https://travis-ci.org/mediarain/voxa-raven.svg?branch=master)](https://travis-ci.org/mediarain/voxa-raven)
[![Coverage Status](https://coveralls.io/repos/github/mediarain/voxa-raven/badge.svg?branch=master)](https://coveralls.io/github/mediarain/voxa-raven?branch=master)

A raven plugin for [voxa](https://mediarain.github.io/voxa/)

Installation
-------------

Just install from [npm](https://www.npmjs.com/package/voxa-raven)

```bash
npm install --save voxa-raven
```

Usage
------

```javascript

const Raven = require('raven');
const voxaRaven = require('voxa-raven');

Raven('https://my-raven-dsn');

voxaRaven(skill, Raven)

```

voxa-raven will create a raven context for every request and attach the client to request.raven so you can use it in your skill. It will also create breadcrumbs for state transitions and include the request in the extra context.

Also, the raven instance attached to `request.raves` is using  [Promise.promisifyAll](http://bluebirdjs.com/docs/api/promise.promisifyall.html) from [Bluebird](http://bluebirdjs.com/docs/getting-started.html)

This means you can use Raven callbacks method with promises:

 - request.raven.captureMessageAsync
 - request.raven.captureExceptionAsync
