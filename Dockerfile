FROM alpine:3.10.2


RUN apk add --no-cache ca-certificates

RUN apk add --no-cache --update \
      git \
      bash \
      nodejs-current \
      npm \
      aria2 \
      coreutils



RUN mkdir /bot
RUN chmod 777 /bot
WORKDIR /bot

COPY . /bot

RUN chmod -R 777 /bot

CMD ["bash","start.sh"]
