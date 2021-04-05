var audioBuffer = null;
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext = null;
var noeudGain = null;
var source;

console.log = function() {}

var app = new Vue({
    el: "#app",
    data: {
	socket: null,
        sounds: [],
	volume: 0.5,
    },
    methods: {
        play: function(url) {
            if (audioContext == null) {
                audioContext = new AudioContext();
		noeudGain = audioContext.createGain();
		noeudGain.gain.value = app.volume;
		noeudGain.connect(audioContext.destination);
            }
            var request = new XMLHttpRequest();
            if (source) {
                try {
                    source.stop();
                } catch (err) {}
            }
            source = audioContext.createBufferSource();
            source.connect(noeudGain);
            request.open('GET', url, true);
            request.responseType = 'arraybuffer';
            request.onload = function() {
                audioContext.decodeAudioData(request.response, function(buffer) {
                    source.buffer = buffer;
                    source.start(0);
                });
            }
            request.send();
        },
	volumeChange: function() {
	    noeudGain.gain.value = app.volume;
	},
	stop: function() {
	    if(source)
		source.stop()
	},
        handleClick: function (event, item) {
            new Contextual({
                isSticky: false,
                items: [
		    {
                        label: 'renommer', onClick: () => {
                            popup.prompt({
				content: 'renommer le son',
				placeholder: item.name,
				btn_align: 'right',
			    },(config) => {
				if(config.input_value && config.proceed){
				    socket.emit('rename', {item: item, rename: config.input_value});
				}
			    });
                        }
                    },
                    {
                        label: 'télécharger', onClick: () => {
                            window.open(item.path, '_blank');
                        }
                    },
                ]
            });
        }
    },
    created: function() {
        socket = io.connect()
        socket.on('soundList', (data) => {
            console.log(data)
            app.sounds = data
        })
        socket.on('newSound', (data) => app.sounds.push(data))
	socket.on('rename', (data) => {
	    app.sounds.find(x => x.name == data.item.name && x.path == data.item.path).name = data.rename;
	})
    }
})