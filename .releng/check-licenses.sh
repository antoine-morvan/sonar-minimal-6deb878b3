#!/bin/bash -eu

DIR=$(cd `dirname $0` && echo `git rev-parse --show-toplevel`)

(cd ${DIR} && npm ci)
(cd ${DIR} && ./node_modules/license-checker/bin/license-checker --summary --production)
