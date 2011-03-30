(function($){

  $.julienMP3Player = { version: '0.1.1' };

  var settings = {
    autoplay: false,
    playNextSoundOnFinish: true,
    hideTrackDetailsAfterPlay: 3, /* N (Number) seconds, or false (Boolean) to always show it */
    soundManagerSwfURL: './swf/', /* path (String), relative to your html page that contains the SWF files that are needed by SoundManager2 */
    soundManagerDebug: false, /* if true, displays the SoundManager2 debug info into the page and in the console */
    markup: '<div class="jmp3_container">\
              <a href="#" class="jmp3_play" title="Play/Pause">Play</a>\
              <a href="#" class="jmp3_stop" title="Stop">Stop</a>\
              <a href="#" class="jmp3_prev" title="Previous">Previous</a>\
              <a href="#" class="jmp3_next" title="Next">Next</a>\
              <a href="#" class="jmp3_infos" title="Show track informations">Infos</a>\
              <span class="jmp3_currentTrackDetails"></span>\
            </div>',
    afterInstanciate: function(){} /* called right after instanciation of the player */
  },

  isPlaying = false,
  timeoutID = 0,

  methods = {
    _loading: function(){
      // console.log(((this.bytesLoaded/this.bytesTotal)*100)+'%');
    },
    _pauseSound: function(soundID, jmp3_content){
      isPlaying = false;
      soundManager.getSoundById(soundID).pause();
      jmp3_content.find('.jmp3_play').removeClass('jmp3_pause');
    },
    _stopSound: function(soundID, jmp3_content){
      isPlaying = false;
      soundManager.getSoundById(soundID).stop();
      jmp3_content.find('.jmp3_play').removeClass('jmp3_pause');
      clearTimeout(timeoutID);
    },
    _getPrevTrackFrom: function(trackIDs, currentTrackID, jmp3_content){
      var currentIndex = trackIDs.indexOf(currentTrackID);
      if (trackIDs[currentIndex - 1]){ // does the previous element exist?
        return trackIDs[currentIndex - 1];
      } else {
        // otherwise, we're at the beginning
        return trackIDs[trackIDs.length - 1]; // so return the last one
      }
    },
    _getNextTrackFrom: function(trackIDs, currentTrackID, jmp3_content){
      var currentIndex = trackIDs.indexOf(currentTrackID);
      if (trackIDs[currentIndex + 1]){ // does the next element exist?
        return trackIDs[currentIndex + 1];
      } else {
        // otherwise, we're at the end
        return trackIDs[0]; // so return the first one
      }
    },
    _displaySong: function(currentTrackID, jmp3_content){
      currentTrackDetails = jmp3_content.find('.jmp3_currentTrackDetails');
      currentTrackDetails.fadeIn();
      currentTrackDetails.text( $('.'+currentTrackID+':eq(0)').attr('title') );
      if (settings.hideTrackDetailsAfterPlay !== false) {
        timeoutID = setTimeout(function(){
          currentTrackDetails.fadeOut();
        }, settings.hideTrackDetailsAfterPlay * 1000);
      }
    }
  };

  $.fn.julienMP3Player = function(options){

    // We need SoundManager2
    if (!soundManager) {
      alert("You need to include SoundManager2 for this plugin to work.");
      return false;
    }

    return this.each(function(elementIndex){

      if (options){ // merge the settings
        $.extend(settings, options);
      }

      var tracks = [], trackIDs = [], matchedObjects = $(this),
          currentSoundID;

      // SoundManager2 options:
      soundManager.url = settings.soundManagerSwfURL;
      soundManager.debugMode = settings.soundManagerDebug;
      soundManager.onload = function(){

        function _playSound(soundID, jmp3_content){
          isPlaying = true;
          methods._displaySong(soundID, $jmp3_content);
          soundManager.getSoundById(soundID).play({
            onfinish: function(){
              isPlaying = false;
              jmp3_content.find('.jmp3_play').removeClass('jmp3_pause');
              currentSoundID = methods._getNextTrackFrom(trackIDs, currentSoundID);
              _playSound(currentSoundID, $jmp3_content);
            }
          });
          if (!jmp3_content.find('.jmp3_play').hasClass('jmp3_pause')){
            jmp3_content.find('.jmp3_play').addClass('jmp3_pause');
          }
        }

        // add the songs from the UL into the tracks array
        matchedObjects.find('li>a').each(function(i){
          trackIDs.push('jmp3_song_'+elementIndex+'_'+i.toString());
          var sound = soundManager.createSound({
            id: trackIDs[trackIDs.length-1],
            url: $(this).attr('href') /*,
            whileloading: methods._loading */
          });
          $(this).addClass(trackIDs[trackIDs.length-1]);
          tracks.push( sound );
        });

        currentSoundID = tracks[0].sID;
        matchedObjects.hide(); // hide the UL markup

        var $jmp3_content = $(settings.markup);

        // play/pause current sound
        $jmp3_content.find('.jmp3_play').bind('click.jmp3', function(){
          if (isPlaying){
            methods._pauseSound(currentSoundID, $jmp3_content); // pause the current track
          } else {
            _playSound(currentSoundID, $jmp3_content); // play the current track
          }
          return false;
        });

        // stop current sound
        $jmp3_content.find('.jmp3_stop').bind('click.jmp3', function(){
          methods._stopSound(currentSoundID, $jmp3_content); // stop the current track
          return false;
        });

        // play previous sound
        $jmp3_content.find('.jmp3_prev').bind('click.jmp3', function(){
          methods._stopSound(currentSoundID, $jmp3_content); // stop the currently playing sound
          currentSoundID = methods._getPrevTrackFrom(trackIDs, currentSoundID); // currentSoundID = previous song
          _playSound(currentSoundID, $jmp3_content); // play the previous track
          return false;
        });

        // play next sound
        $jmp3_content.find('.jmp3_next').bind('click.jmp3', function(){
          methods._stopSound(currentSoundID, $jmp3_content); // stop the currently playing sound
          currentSoundID = methods._getNextTrackFrom(trackIDs, currentSoundID); // currentSoundID = next song
          _playSound(currentSoundID, $jmp3_content); // play the next track
          return false;
        });

        // show track infos
        $jmp3_content.find('.jmp3_infos').bind('click.jmp3', function(){
          methods._displaySong(currentSoundID, $jmp3_content);
          return false;
        });

        // inject the player's markup into the DOM
        matchedObjects.after($jmp3_content);

        if (settings.autoplay){
          _playSound(currentSoundID, $jmp3_content);
        }

        settings.afterInstanciate(); // call the callback
      }
    });
  };
})(jQuery);

