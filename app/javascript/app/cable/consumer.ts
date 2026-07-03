// ActionCable consumer. Same-origin /cable handshake is authenticated by the
// session cookie automatically — no token needed. Channel hooks are added in
// the real-time phase.
import { createConsumer, type Consumer } from "@rails/actioncable"

let consumer: Consumer | null = null

export function getConsumer(): Consumer {
  if (!consumer) {
    consumer = createConsumer("/cable")
  }
  return consumer
}
