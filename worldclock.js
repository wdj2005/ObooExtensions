var cardInfo = {
    id: -1,
    responseTopic: '/worldClockCard_' + getEpochMillis(),
    // bgColor: 0xc44569,
    bgColor: 0x0,
    params: {
        locOne: 'LocationOne',
        locTwo: 'LocationTwo',
        offsetOne: 0,
        offsetTwo: 0
    },
    enabled: true
}

// definitions for the program

// Elements on the Card
var elementId = {
    locOneTitle: 0,
    locOneTime: 1,
    locTwoTitle: 2,
    locTwoTime: 3,
    separator: 4,
    cover: 8
}

// Return a formatted time string, at offset
function getFormattedTime (offSet1,offSet2) {

    var date = new Date()

    return {
        locOneTime: zeroPad((date.getHours() + offSet1) % 24,2) + ':' + zeroPad(date.getMinutes(),2),
        locTwoTime: zeroPad((date.getHours() + offSet2) % 24,2) + ':' + zeroPad(date.getMinutes(),2)
 
    }
}


function createCard () {
    var timesObj = getFormattedTime(cardInfo.params.offsetOne,cardInfo.params.offsetTwo)
    var cardObj = generateNewCardObj(cardInfo.bgColor, cardInfo.responseTopic)

    // location One
    cardObj.elements.push(generateTextElement(
        elementId.locOneTitle,
        cardInfo.params.locOne,
        23,
        0, 0, 'center')
    )
    cardObj.elements.push(generateTextElement(                                                                     
        elementId.locOneTime,                                                                                     
        timesObj.locOneTime,                                                                                    
        82,                                                                                                        
        0, 15, 'center')                                                                                            
    ) 

    // line separator
    cardObj.elements.push(generateImageElement(
        elementId.separator,
        generateImgPath(imgRootPath, 'line'),
        21, 110)
    )

    // location Two
    cardObj.elements.push(generateTextElement(                                                                     
        elementId.locTwoTitle,                                                                                     
        cardInfo.params.locTwo,                                                                                              
        23,                                                                                                        
        0, 120, 'center')                                                                                           
    ) 
    cardObj.elements.push(generateTextElement(                                                                     
        elementId.locTwoTime,                                                                                      
        timesObj.locTwoTime,                                                                                                   
        82,                                                                                                        
        0, 130, 'center')                                                                                              
    )

    // init the card
    initCard(JSON.stringify(cardObj), true)
}

var cycleCounter = 100
function cycleInfo () {
    cycleCounter += 1
    if (cycleCounter >= 100) {
        cycleCounter = 0
        return true
    } else {
        cycleCounter += 1
        return false
    }
}




function updateDisplay (forceUpdate) {

    var updateObj = generateUpdateCardObj(cardInfo.id)
    var update = forceUpdate?true:false

    var timesObj = getFormattedTime(cardInfo.params.offsetOne,cardInfo.params.offsetTwo)                     

    /* Times */
    // Location 1
    updateObj.elements.push(generateElementUpdate(
       elementId.locOneTime,
       timesObj.locOneTime)
    )
    // Location 2
    updateObj.elements.push(generateElementUpdate(                                                             
       elementId.locTwoTime,                                                                                  
       timesObj.locTwoTime)                                                                                      
    )  

    updateCard(JSON.stringify(updateObj))
}

function readConfig() {
    readFile('/etc/config.json', '', function (err, data) {
        if (!err) {
            var config;
    	    try {
    	        config = JSON.parse(data);
    	    } catch(e) {
    	        print(e); // error in the above string!
    	        return null;
    	    }

    	    // apply the settings from the config file
    	    cardIdentifier  = 0;    // TODO: this is temporary
    	    cardInfo.params.locOne        = config.cards['4'].locOne || cardInfo.params.locOne;
            cardInfo.params.locTwo        = config.cards['4'].locTwo || cardInfo.params.locTwo;                                                           
            cardInfo.params.offsetOne     = config.cards['4'].offsetOne || cardInfo.params.offsetOne;
            cardInfo.params.offsetTwo     = config.cards['4'].offsetTwo || cardInfo.params.offsetTwo;
 
  
          if(config.cards['4'] && config.cards['4'].enabled !== undefined){
            cardInfo.enabled = config.cards['4'].enabled && cardInfo.enabled;
          }
        }
        print("card is enabled: " + cardInfo.enabled);
    });
}

function setup() {
    readConfig();
    if(cardInfo.enabled == true){
      connect('localhost', 1883, null, function () {
          subscribe('/cardResponse', function () {
              createCard();
          });
          subscribe('/config/update');
        },
        null,
        '/card',
        JSON.stringify({
          cmd: 'remove_card',
          cardName: cardInfo.responseTopic
        })
      );
   }
}

function loop() {
    // update display every loop

    // exit program if card is invalid
    if (cardInfo.invalid === true) return -1
    
    if (cardInfo.id >= 0) {
        updateDisplay()
    }

}

function onInput(e) {
    if (typeof e.source !== 'undefined' && typeof e.payload !== 'undefined' ) {
        print('input! input source: ' + e.source + ', value: ' + e.payload)
    }
}

function onMessage(e) {
    if (typeof e.topic !== 'undefined' && typeof e.payload !== 'undefined' ) {
        print('message! topic: ' + e.topic + ', value: ' + e.payload)
        switch (e.topic) {
            case '/cardResponse':
              cardInfo = handleCardResponseMessage(cardInfo, e.payload)
              break
            case '/config/update':
              readConfig()
              cardInfo.params.prevUpdate = 0 // force an update
              break
            default:
              break
        }
    }
}
