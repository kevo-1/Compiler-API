FROM gcc:latest

WORKDIR /tmp

RUN apk add --no-cache coreutils

CMD ["sh"]