FROM golang:1.19

WORKDIR /go/src/github.com/magunetto/moviemagnetbot
COPY . .
RUN go mod tidy
RUN cd cmd/moviemagnetbot && go build

CMD ["./cmd/moviemagnetbot/moviemagnetbot"]
