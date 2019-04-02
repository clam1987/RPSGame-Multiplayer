var RPS = {
  //firebase config info
  config: {
    apiKey: "AIzaSyASZyL9vOVdMKhGfDl8oLKrm75xfU4Adjo",
    authDomain: "rps2-684ca.firebaseapp.com",
    databaseURL: "https://rps2-684ca.firebaseio.com",
    projectId: "rps2-684ca",
    storageBucket: "rps2-684ca.appspot.com",
    messagingSenderId: "1049426981920"
  },
  database: "",
  numPlayers: 0,
  playerDesignation: "",
  playerDB: "",
  messagesDB: "",

  //intialize firebase funciton
  init: function () {
    console.log('hello')
    firebase.initializeApp(this.config);
    database = firebase.database();
    playerDB = database.ref('players/');    //Name Storage
    messagesDB = database.ref('messages/'); //Message Storage
    RPS.clickHandlers();                    //activate listeners
  },
  clickHandlers: function () {
    //add new player name
    $(".ready").on("click", e =>  {
      console.log(this)
      var currentPlayer = $(e.target).attr("data-player");
      var textInput = $('#' + currentPlayer + ' .name').val().trim();
      if (textInput == "") {
        alert("Please enter username")
      } else {
        //Log playername into firebase
        RPS.playerDesignation = currentPlayer;
        RPS.players[RPS.playerDesignation] = new RPS.player(textInput);
        RPS.updatePlayers();
        var connectionsRef = database.ref('/players/' + RPS.playerDesignation);
        connectionsRef.set(RPS.players[RPS.playerDesignation]);
        //remove DB if player d/c
        connectionsRef.onDisconnect(      //delete user off firebase
          function () {
            messagesDB.push(new RPS.message(textInput + ' quit the game', 'admin'));
          }
        ).remove();
        $('.name').attr('disabled', true); //Makes sure there is no duplicates
      }
    });

    //When player picks rock paper or scissors
    $('.move').on("click", function (e) {
      var currentPlayer = $(e.target.offsetParent).attr('id');
      //keep tracks of player moves
      RPS.players[currentPlayer].lastMove = $(e.target).attr("data-move");
      //hide other players move
      $('#' + RPS.playerDesignation + ' .move').not($(e.target)).hide();
      //Send players data to firebase
      playerDB.set(RPS.players);
    });

    playerDB.on('value', function (data) {
      //Delete Data if nothing is in firebase
      if (data.val() == null) {
        players = {
          player1: null,
          player2: null,
        };
      } else {
        //access DB for changes
        RPS.players = data.val();
        RPS.numPlayers = Object.keys(data.val()).length;
        //Check to see if there are 2 players
        if (RPS.numPlayers > 1) {
          let moveFlag = true;
          //Check if both players have made a move
          for (key in RPS.players) {
            if (RPS.players[key].lastMove === "") {
              moveFlag = false;
              break;
            }
          } if (moveFlag) {
            //Fetch Results
            RPS.getResult();
          }
        }
        //Update HTML DOM
        RPS.updatePlayers();
      }
    }, function (error) { alert("Error 404!") });

    //Chat Handler Section
    //new message
    messagesDB.on('child_added', function (data) {
      //Send text to DOM
      RPS.showMessage(data.val());
    }, function (e) {
      alert("You have been disconnected");
    });

    $('#submit').on('click', function (e) {
      //Prevent Page Refresh
      e.preventDefault();
      let message = $('#message').val().trim();
      //no Blank Messages
      if (message === "") {
        alert("No message is NOT a Message!");
      } else {
        //Makes a message and sends it to firebase
        messagesDB.push(new RPS.message(message));
      }
      //Clear message box
      $('#message').val("");
    });
  },

  updatePlayers: function () {
    //Show the name
    $('.player-name').html("Player Name: ")
    $('.form-group').slideDown();
    //Update UI with all player info
    for (currentPlayer in RPS.players) {
      if (RPS.players[currentPlayer] != null) {
        $('#' + currentPlayer + ' .player-title').html("Player Name: " + RPS.players[currentPlayer].name);
        $('#' + currentPlayer + ' .win').html(RPS.players[currentPlayer].wins);
        $('#' + currentPlayer + ' .loss').html(RPS.players[currentPlayer].losses);
        $('#' + currentPlayer + ' .tie').html(RPS.players[currentPlayer].ties);
        $('#' + currentPlayer + ' .form-group').slideUp();
        $('.move-text').html("Waiting for another player");
        $('.moves :button').attr('disabled', true);
        RPS.checkPlayers();
      }
    }
  },

  //function to enable moves
  checkPlayers: function () {
    for (key in RPS.players) {
      if (RPS.players[key] == null) {
        //If players missing, then disable all buttons
        $('#' + key + '.moves :button').attr('disabled', true);
      } else if (RPS.numPlayers > 1) {
        //checks to see if we have to players ^ and enable button (down)
        $('#' + RPS.playerDesignation + ' .moves :button').removeAttr('disabled');
        $('#' + key + '.move-text').html("Your Move");
        $('#' + key + '.player-title').html('Player Name: ' + RPS.players[key].name);
      }
    }
  },

  //show buttons
  refresh: function () {
    $('.moves :button').show();
  },

  //calculate who won last round
  getResult: function () {
    RPS.refresh();
    if (RPS.players['player1'].lastMove === RPS.players['player2'].lastMove) {
      RPS.winner('tied');
    } else {
      switch (RPS.players['player1'].lastMove) {
        case 'rock':
          if (RPS.players['player2'].lastMove === 'paper') {
            RPS.winner('player2');
          } else {
            RPS.winner('player1');
          } break;
        case 'scissor':
          if (RPS.players['player2'].lastMove === 'rock') {
            RPS.winner('player2');
          } else {
            RPS.winner('player1');
          } break;
        case 'paper':
          if (RPS.players['player2'].lastMove === 'scissors') {
            RPS.winner('player2');
          } else {
            RPS.winner('player1');
          } break;
      }
    }
  },

  //call getResult function to update DOM
  winner: function (aPlayer) {
    if (aPlayer === "tied") {
      $('.result').html("You both tied with " + RPS.players[RPS.playerDesignation].lastMove);
      for (currentPlayer in RPS.players) {
        RPS.players[currentPlayer].lastMove = "";
        RPS.players[currentPlayer].ties++;
      }
    } else {
      $('.result').html(RPS.players[aPlayer].name + "won with" + RPS.players[aPlayer].lastMove);
      RPS.players[aPlayer].wins++;
      for (currentPlayer in RPS.players) {
        RPS.players[currentPlayer].lastMove = "";
        if (currentPlayer != aPlayer) {
          RPS.players[currentPlayer].losses++;
        }
      }
    }
    //enable move buttons
    RPS.refresh();
    //send new data to firebase
    playerDB.set(RPS.players);
  },

  //how to style the message
  showMessage: function (message) {
    let style = "";
    switch (message.sender) {
      case 'anonymous':
        style = 'anonymous';
        break;
      case 'admin':
        style = 'anonymous';
        break;
      case RPS.playerDesignation:
        style = 'left';
        break;
      default:
        style = 'right';
    }
    //append messages to message list
    $('.messages ul').append($('<li class="li-' + style + '">').html('<span class="li-message">' + message.message + '</span>' + '<span class="li-username">- ' + message.sender + " | " + message.time + '</span>'));
    //scroll to bottom
    $('.messages').animate({ scrollTop: $('.messages').prop("scrollHeight") }, 1000);
  },


  //player class to hold data
  player: function (name) {
    this.name = name;
    this.wins = 0;
    this.losses = 0;
    this.ties = 0;
    this.lastMove = "";
  },

  //message class to create object for the texts
  message: function (chat, sender = 'anonymous') {
    if (sender != 'admin') {
      if (RPS.playerDesignation != "") {
        sender = RPS.playerDesignation;
      }
    }
    this.sender = sender;
    this.message = chat;
    this.time = new Date().toLocaleTimeString();
    console.log(this.sender + ":" + chat);
  },
  players: { player1: null, player2: null }
}

// $(document).on('ready', function () {
  RPS.init();
// });