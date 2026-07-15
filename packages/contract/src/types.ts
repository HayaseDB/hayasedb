import type {
  InferRouterContractInputs,
  InferRouterContractOutputs,
} from '@orpc/contract'
import type { contract } from './routers'

export type Inputs = InferRouterContractInputs<typeof contract>

export type Outputs = InferRouterContractOutputs<typeof contract>
