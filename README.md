# MyoMedia

> Natural interface for your home media centre

## About

You use the Myo (gestures) to control your TV (through Chromecast) and play your home media. You can search and select movies and TV shows via voice.

So you make a gesture, say you want to watch a movie, and pick a movie with voice (text-to-speech feedback “do you want to watch X-Men: First Class or Wolverine?”), then it'll automatically stream that from your media centre to your Chromecast on your TV, and you can control volume, and rewind/fast-forward with Myo gestures to Chromecast.

## Requirements

Requires you to install [SoX](http://sox.sourceforge.net/).
See https://github.com/gillesdemey/node-record-lpcm16#dependencies for details.

### Mac OS X

```bash
brew install sox
```

### Linux

```bash
sudo apt-get install sox libsox-fmt-all
```

## Development

```bash
npm install
bower install
```

### Run

```bash
npm start
```

### Build

```bash
npm run build
```


## License

MIT © [Glavin Wiechert](https://github.com/Glavin001/MyoMedia)
