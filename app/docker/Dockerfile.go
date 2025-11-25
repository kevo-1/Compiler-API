FROM golang:alpine

WORKDIR /app

RUN go env -w GO111MODULE=auto

CMD ["go", "run"]