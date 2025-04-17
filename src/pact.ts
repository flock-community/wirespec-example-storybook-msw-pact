import {PactV4} from "@pact-foundation/pact";

export const pact = new PactV4({
  consumer: 'consumer-name',
  provider: 'provider-name'
})

