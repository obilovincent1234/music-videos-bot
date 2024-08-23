FROM golang:1.19

WORKDIR /go/src/github.com/obilovincent1234/music-videos-bot
COPY . .

# Run go mod tidy to ensure go.sum is up-to-date


# Build the application
RUN cd cmd/moviemagnetbot && go build

CMD ["./cmd/moviemagnetbot/moviemagnetbot"]
