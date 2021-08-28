import { fastify, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import fastifyWebsocket, { SocketStream } from 'fastify-websocket'

enum WebSocketStatus {
  CONNECTING = 0,
  /** The connection is open and ready to communicate. */
  OPEN = 1,
  /** The connection is in the process of closing. */
  CLOSING = 2,
  /** The connection is closed. */
  CLOSED = 3,
}

export const app: FastifyInstance = fastify({
  logger: false,
})

const clients: { [k: string]: SocketStream } = {}

const getUniqueID = () => {
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1)
  return s4() + s4() + '-' + s4()
}

app
  .register(fastifyWebsocket, {
    errorHandler: (error: Error, conn: SocketStream, req: FastifyRequest, reply: FastifyReply): void => {
      conn.destroy(error)
    },
    options: { maxPayload: 1048576, clientTracking: true },
  })
  .then(() => {
    app.get<IGetParams>('/*', { websocket: true }, async (connection: SocketStream, req: FastifyRequest) => {
      let intHandle: ReturnType<typeof setInterval>
      let dataHandle: ReturnType<typeof setInterval>
      const userID = getUniqueID()
      clients[userID] = connection
      connection?.socket?.send('heartbeat')
      console.log('Backend sending first heartbeat...')

      intHandle = setInterval(() => {
        if (connection?.socket?.readyState === WebSocketStatus.OPEN) {
          console.log('sending heartbeat...')
          connection?.socket?.send('heartbeat')
        }
      }, 20000)

      connection.socket.on('message', (msg: Blob) => {
        const message = msg.toString()
        if (message === 'heartbeat') {
          console.log('Backend received ACK for heartbeat...')
        } else {
          console.log('Backend received a message: ', message)
          dataHandle = setInterval(() => {
            connection?.socket?.send(message)
          }, 5000)
        }
      })
      connection.socket.on('open', (message: Blob) => {
        console.log('Backend test app received open: ', message)
      })

      connection.socket.on('error', (err: Blob) => {
        console.error('Error on socket: ', err)
      })

      connection.socket.on('close', (message: Blob) => {
        console.log('Backend received close: ', message)
        delete clients[userID]
        connection.socket.terminate()
        connection.socket.close()
        clearInterval(intHandle)
        clearInterval(dataHandle)
      })
    })
  })

interface IGetParamsQueryString {
  name: string
}

interface IGetParams {
  Querystring: IGetParamsQueryString
}

app.listen(3500, (err) => {
  if (err) {
    process.exit(1)
  }
})
