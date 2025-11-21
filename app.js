
var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
//facebook app token
var api = require('instagram-node').instagram();
var token = ""
var Twitter = require('twitter');

app.use('/static', express.static('public'))

var client = new Twitter({
  consumer_key: '',
  consumer_secret: '',
  access_token_key: '',
  access_token_secret: ''
});

//örnek fotoğraf
var data = require('fs').readFileSync('public/gazete-mansetleri.jpg');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

//instagram Api
api.use({
  client_id: '',
  client_secret: ''
});

var redirect_uri = 'http://sondurum-89701.onmodulus.net/handleauth';

//instagram
exports.authorize_user = function(req, res) {
  res.redirect(api.get_authorization_url(redirect_uri, { scope: ['likes'], state: 'a state' }));
};

exports.handleauth = function(req, res) {
  api.authorize_user(req.query.code, redirect_uri, function(err, result) {
    if (err) {
      console.log(err.body);
      res.send("Token Alınamadı!");
    } else {
      console.log('Access token is ' + result.access_token);
      res.send('Çalışıyor');
    }
  });
};

// This is where you would initially send users to authorize
app.get('/authorize_user', exports.authorize_user);
// This is your redirect URI
app.get('/handleauth', exports.handleauth);

// Web sayfası çalışırlık testi
app.get('/', function(req , res){
	res.send('world!')
});

// Facebook application doğrulama
app.get('/webhook', function(req, res) {
	if (req.query['hub.verify_token'] === 'verify-token') {
			res.send(req.query['hub.challenge']);
			sendGenericMessage(sender);
	} else {
			res.send('Invalid verify token');
	}
});

// Fb Messenger handle
app.post("/webhook/", function(req, res) {
	messaging_events = req.body.entry[0].messaging;
	for (i = 0; i < messaging_events.length; i++) {
		event = req.body.entry[0].messaging[i];
		sender = event.sender.id;
		if (event.message && event.message.text) {
			text = event.message.text;

			if(text=="Son Durum"){
         oranlarSonDurum(sender);
			}else{
				if(text=="özet")
				sendGenericMessage(sender);
				else
				sendTextMessage(sender, "Alınan mesaj: " + text);

			}

		}
	}
	res.sendStatus(200);
});

//Twitter
app.get('/twitter', function(req, res) {
	client.post('media/upload', {media: data}, function(error, media, response) {

  if (!error) {
    // başarılı olursa istek obje dönecek
    //console.log(media);
    // tweet atılacak
    var status = {
      status: 'Resimli gün özeti',
      media_ids: media.media_id_string // Media id stringi atanacak
    }

    client.post('statuses/update', status, function(error, tweet, response) {
      if (!error) {
        console.log(tweet);
      }
    });

  }
	})
	res.sendStatus(200);
});

app.get('/facebook', function(req, res) {
  sendPagePost();
	res.sendStatus(200);
});

//Fonksiyonlar

//pageid/feed e istek yollandığında sayfaya server üzerinden gün özeti atılır.
function sendPagePost(sender, text) {
	messageData = {
		text: text
	};
	request({
		url: "https://graph.facebook.com/v2.8/1676849415962995/photos",
		qs: { access_token: token },
		method: "POST",
		json: {
			url: "http://sondurum-89701.onmodulus.net/static/gazete-mansetleri.jpg",
      caption: "Gün Özeti http://www.hurriyet.com"
		}
	}, function(error, response, body) {
		if (error) {
			console.log("Error sending message: ", error);
		} else if (response.body.error) {
			console.log("Error: ", response.body.error);
		}
	});
}

function sendTextMessage(sender, text) {
	messageData = {
		text: text
	};
	request({
		url: "https://graph.facebook.com/v2.6/me/messages",
		qs: { access_token: token },
		method: "POST",
		json: {
			recipient: { id: sender },
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log("Error sending message: ", error);
		} else if (response.body.error) {
			console.log("Error: ", response.body.error);
		}
	});
}

function oranlarSonDurum(sender) {

	request('http://api.fixer.io/latest', function (error, response, body) {
  if (!error && response.statusCode == 200) {
		//sendTextMessage(sender,response.body);
		var gelen = JSON.parse(body);
		//console.log("**" + gelen.date);
		var gelenStr = JSON.stringify(gelen.rates,null,2);

		sendTextMessage(sender,gelenStr.substring(0,gelenStr.length/2));
		sendTextMessage(sender,gelenStr.substring(gelenStr.length/2,gelenStr.length));
  }else{
		console.log("Oranlar Çekilemedi!");
		sendTextMessage(sender,"Oranlar Çekilemedi!");
	}
	});
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: token },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s",
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });
}

function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "Haber BaşlığıHaber BaşlığıHaber BaşlığıHaber BaşlığıHaber BaşlığıHaber BaşlığıHaber BaşlığıHaber BaşlığıHaber BaşlığıHaber BaşlığıHaber BaşlığıHaber BaşlığıHaber BaşlığıHaber BaşlığıHaber Başlığı",
            subtitle: "Haber ÖzetiHaber ÖzetiHaber ÖzetiHaber ÖzetiHaber ÖzetiHaber ÖzetiHaber ÖzetiHaber ÖzetiHaber ÖzetiHaber ÖzetiHaber ÖzetiHaber ÖzetiHaber ÖzetiHaber ÖzetiHaber ÖzetiHaber ÖzetiHaber ÖzetiHaber ÖzetiHaber ÖzetiHaber ÖzetiHaber Özeti",
            item_url: "https://www.oculus.com/en-us/rift/",
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Devamını Oku"
            }],
          }, {
            title: "Haber Başlığı",
            subtitle: "Haber Özeti",
            item_url: "https://www.oculus.com/en-us/touch/",
            image_url: "http://messengerdemo.parseapp.com/img/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Devamını Oku"
            }]
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}


app.listen(process.env.PORT || 3000);
