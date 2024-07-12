ARG APP_PATH=/opt/mote
FROM node:20-slim as base

ARG APP_PATH
WORKDIR $APP_PATH

COPY ./package.json ./
COPY ./patches ./patches

RUN yarn install --no-optional --frozen-lockfile --network-timeout 1000000 

COPY . .
ARG CDN_URL
RUN yarn build

RUN rm -rf node_modules

RUN yarn install --production=true --frozen-lockfile --network-timeout 1000000 && \
  yarn cache clean

# ---
FROM node:20-slim AS runner

LABEL org.opencontainers.image.source="https://github.com/moteapp/mote"

ARG APP_PATH
WORKDIR $APP_PATH
ENV NODE_ENV production

COPY --from=base $APP_PATH/build ./build
COPY --from=base $APP_PATH/server ./server
COPY --from=base $APP_PATH/public ./public
COPY --from=base $APP_PATH/.sequelizerc ./.sequelizerc
COPY --from=base $APP_PATH/node_modules ./node_modules
COPY --from=base $APP_PATH/package.json ./package.json

# Create a non-root user compatible with Debian and BusyBox based images
RUN addgroup --gid 1001 nodejs && \
  adduser --uid 1001 --ingroup nodejs nodejs && \
  chown -R nodejs:nodejs $APP_PATH/build && \
  mkdir -p /var/lib/mote && \
	chown -R nodejs:nodejs /var/lib/mote

ENV FILE_STORAGE_LOCAL_ROOT_DIR /var/lib/mote/data
RUN mkdir -p "$FILE_STORAGE_LOCAL_ROOT_DIR" && \
  chown -R nodejs:nodejs "$FILE_STORAGE_LOCAL_ROOT_DIR" && \
  chmod 1777 "$FILE_STORAGE_LOCAL_ROOT_DIR"

VOLUME /var/lib/mote/data

USER nodejs

EXPOSE 3000
CMD ["yarn", "start"]
