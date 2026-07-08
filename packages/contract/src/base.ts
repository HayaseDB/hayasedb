import { oc } from '@orpc/contract'

import '@orpc/openapi/extensions/route'
import { commonErrors } from './errors'

export const base = oc.errors(commonErrors)
