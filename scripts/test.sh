#!/bin/sh

set -e
set -x

jshint .
jscs .
istanbul cover mocha --report lcovonly
