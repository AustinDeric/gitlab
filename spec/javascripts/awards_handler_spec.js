/* eslint-disable space-before-function-paren, no-var, one-var, one-var-declaration-per-line, no-unused-expressions, comma-dangle, new-parens, no-unused-vars, quotes, jasmine/no-spec-dupes, prefer-template, max-len */

import promisePolyfill from 'es6-promise';
import Cookies from 'js-cookie';
import AwardsHandler from '~/awards_handler';

promisePolyfill.polyfill();

(function() {
  var awardsHandler, lazyAssert, urlRoot, openAndWaitForEmojiMenu;

  awardsHandler = null;

  window.gl || (window.gl = {});

  window.gon || (window.gon = {});

  urlRoot = gon.relative_url_root;

  lazyAssert = function(done, assertFn) {
    return setTimeout(function() {
      assertFn();
      return done();
    // Maybe jasmine.clock here?
    }, 333);
  };

  describe('AwardsHandler', function() {
    preloadFixtures('issues/issue_with_comment.html.raw');
    beforeEach(function() {
      loadFixtures('issues/issue_with_comment.html.raw');
      awardsHandler = new AwardsHandler;
      spyOn(awardsHandler, 'postEmoji').and.callFake((function(_this) {
        return function(url, emoji, cb) {
          return cb();
        };
      })(this));

      let isEmojiMenuBuilt = false;
      openAndWaitForEmojiMenu = function() {
        return new Promise((resolve, reject) => {
          if (isEmojiMenuBuilt) {
            resolve();
          } else {
            $('.js-add-award').eq(0).click();
            const $menu = $('.emoji-menu');
            $menu.one('build-emoji-menu-finish', () => {
              isEmojiMenuBuilt = true;
              resolve();
            });

            // Fail after 1 second
            setTimeout(reject, 1000);
          }
        });
      };
    });
    afterEach(function() {
      // restore original url root value
      gon.relative_url_root = urlRoot;

      awardsHandler.destroy();
    });
    describe('::showEmojiMenu', function() {
      it('should show emoji menu when Add emoji button clicked', function(done) {
        $('.js-add-award').eq(0).click();
        return lazyAssert(done, function() {
          var $emojiMenu;
          $emojiMenu = $('.emoji-menu');
          expect($emojiMenu.length).toBe(1);
          expect($emojiMenu.hasClass('is-visible')).toBe(true);
          expect($emojiMenu.find('#emoji_search').length).toBe(1);
          return expect($('.js-awards-block.current').length).toBe(1);
        });
      });
      it('should also show emoji menu for the smiley icon in notes', function(done) {
        $('.js-add-award.note-action-button').click();
        return lazyAssert(done, function() {
          var $emojiMenu = $('.emoji-menu');
          return expect($emojiMenu.length).toBe(1);
        });
      });
      return it('should remove emoji menu when body is clicked', function(done) {
        $('.js-add-award').eq(0).click();
        return lazyAssert(done, function() {
          var $emojiMenu;
          $emojiMenu = $('.emoji-menu');
          $('body').click();
          expect($emojiMenu.length).toBe(1);
          expect($emojiMenu.hasClass('is-visible')).toBe(false);
          return expect($('.js-awards-block.current').length).toBe(0);
        });
      });
    });
    describe('::addAwardToEmojiBar', function() {
      it('should add emoji to votes block', function() {
        var $emojiButton, $votesBlock;
        $votesBlock = $('.js-awards-block').eq(0);
        awardsHandler.addAwardToEmojiBar($votesBlock, 'heart', false);
        $emojiButton = $votesBlock.find('[data-name=heart]');
        expect($emojiButton.length).toBe(1);
        expect($emojiButton.next('.js-counter').text()).toBe('1');
        return expect($votesBlock.hasClass('hidden')).toBe(false);
      });
      it('should remove the emoji when we click again', function() {
        var $emojiButton, $votesBlock;
        $votesBlock = $('.js-awards-block').eq(0);
        awardsHandler.addAwardToEmojiBar($votesBlock, 'heart', false);
        awardsHandler.addAwardToEmojiBar($votesBlock, 'heart', false);
        $emojiButton = $votesBlock.find('[data-name=heart]');
        return expect($emojiButton.length).toBe(0);
      });
      return it('should decrement the emoji counter', function() {
        var $emojiButton, $votesBlock;
        $votesBlock = $('.js-awards-block').eq(0);
        awardsHandler.addAwardToEmojiBar($votesBlock, 'heart', false);
        $emojiButton = $votesBlock.find('[data-name=heart]');
        $emojiButton.next('.js-counter').text(5);
        awardsHandler.addAwardToEmojiBar($votesBlock, 'heart', false);
        expect($emojiButton.length).toBe(1);
        return expect($emojiButton.next('.js-counter').text()).toBe('4');
      });
    });
    describe('::getAwardUrl', function() {
      return it('returns the url for request', function() {
        return expect(awardsHandler.getAwardUrl()).toBe('http://test.host/frontend-fixtures/issues-project/issues/1/toggle_award_emoji');
      });
    });
    describe('::addAward and ::checkMutuality', function() {
      return it('should handle :+1: and :-1: mutuality', function() {
        var $thumbsDownEmoji, $thumbsUpEmoji, $votesBlock, awardUrl;
        awardUrl = awardsHandler.getAwardUrl();
        $votesBlock = $('.js-awards-block').eq(0);
        $thumbsUpEmoji = $votesBlock.find('[data-name=thumbsup]').parent();
        $thumbsDownEmoji = $votesBlock.find('[data-name=thumbsdown]').parent();
        awardsHandler.addAward($votesBlock, awardUrl, 'thumbsup', false);
        expect($thumbsUpEmoji.hasClass('active')).toBe(true);
        expect($thumbsDownEmoji.hasClass('active')).toBe(false);
        $thumbsUpEmoji.tooltip();
        $thumbsDownEmoji.tooltip();
        awardsHandler.addAward($votesBlock, awardUrl, 'thumbsdown', true);
        expect($thumbsUpEmoji.hasClass('active')).toBe(false);
        return expect($thumbsDownEmoji.hasClass('active')).toBe(true);
      });
    });
    describe('::removeEmoji', function() {
      return it('should remove emoji', function() {
        var $votesBlock, awardUrl;
        awardUrl = awardsHandler.getAwardUrl();
        $votesBlock = $('.js-awards-block').eq(0);
        awardsHandler.addAward($votesBlock, awardUrl, 'fire', false);
        expect($votesBlock.find('[data-name=fire]').length).toBe(1);
        awardsHandler.removeEmoji($votesBlock.find('[data-name=fire]').closest('button'));
        return expect($votesBlock.find('[data-name=fire]').length).toBe(0);
      });
    });
    describe('::addYouToUserList', function() {
      it('should prepend "You" to the award tooltip', function() {
        var $thumbsUpEmoji, $votesBlock, awardUrl;
        awardUrl = awardsHandler.getAwardUrl();
        $votesBlock = $('.js-awards-block').eq(0);
        $thumbsUpEmoji = $votesBlock.find('[data-name=thumbsup]').parent();
        $thumbsUpEmoji.attr('data-title', 'sam, jerry, max, and andy');
        awardsHandler.addAward($votesBlock, awardUrl, 'thumbsup', false);
        $thumbsUpEmoji.tooltip();
        return expect($thumbsUpEmoji.data("original-title")).toBe('You, sam, jerry, max, and andy');
      });
      return it('handles the special case where "You" is not cleanly comma seperated', function() {
        var $thumbsUpEmoji, $votesBlock, awardUrl;
        awardUrl = awardsHandler.getAwardUrl();
        $votesBlock = $('.js-awards-block').eq(0);
        $thumbsUpEmoji = $votesBlock.find('[data-name=thumbsup]').parent();
        $thumbsUpEmoji.attr('data-title', 'sam');
        awardsHandler.addAward($votesBlock, awardUrl, 'thumbsup', false);
        $thumbsUpEmoji.tooltip();
        return expect($thumbsUpEmoji.data("original-title")).toBe('You and sam');
      });
    });
    describe('::removeYouToUserList', function() {
      it('removes "You" from the front of the tooltip', function() {
        var $thumbsUpEmoji, $votesBlock, awardUrl;
        awardUrl = awardsHandler.getAwardUrl();
        $votesBlock = $('.js-awards-block').eq(0);
        $thumbsUpEmoji = $votesBlock.find('[data-name=thumbsup]').parent();
        $thumbsUpEmoji.attr('data-title', 'You, sam, jerry, max, and andy');
        $thumbsUpEmoji.addClass('active');
        awardsHandler.addAward($votesBlock, awardUrl, 'thumbsup', false);
        $thumbsUpEmoji.tooltip();
        return expect($thumbsUpEmoji.data("original-title")).toBe('sam, jerry, max, and andy');
      });
      return it('handles the special case where "You" is not cleanly comma seperated', function() {
        var $thumbsUpEmoji, $votesBlock, awardUrl;
        awardUrl = awardsHandler.getAwardUrl();
        $votesBlock = $('.js-awards-block').eq(0);
        $thumbsUpEmoji = $votesBlock.find('[data-name=thumbsup]').parent();
        $thumbsUpEmoji.attr('data-title', 'You and sam');
        $thumbsUpEmoji.addClass('active');
        awardsHandler.addAward($votesBlock, awardUrl, 'thumbsup', false);
        $thumbsUpEmoji.tooltip();
        return expect($thumbsUpEmoji.data("original-title")).toBe('sam');
      });
    });
    describe('search', function() {
      return it('should filter the emoji', function(done) {
        return openAndWaitForEmojiMenu()
          .then(() => {
            expect($('[data-name=angel]').is(':visible')).toBe(true);
            expect($('[data-name=anger]').is(':visible')).toBe(true);
            $('#emoji_search').val('ali').trigger('input');
            expect($('[data-name=angel]').is(':visible')).toBe(false);
            expect($('[data-name=anger]').is(':visible')).toBe(false);
            expect($('[data-name=alien]').is(':visible')).toBe(true);
          })
          .then(done)
          .catch((err) => {
            done.fail(`Failed to open and build emoji menu: ${err.message}`);
          });
      });
    });
    describe('emoji menu', function() {
      const emojiSelector = '[data-name="sunglasses"]';
      const openEmojiMenuAndAddEmoji = function() {
        return openAndWaitForEmojiMenu()
          .then(() => {
            const $menu = $('.emoji-menu');
            const $block = $('.js-awards-block');
            const $emoji = $menu.find('.emoji-menu-list:not(.frequent-emojis) ' + emojiSelector);

            expect($emoji.length).toBe(1);
            expect($block.find(emojiSelector).length).toBe(0);
            $emoji.click();
            expect($menu.hasClass('.is-visible')).toBe(false);
            expect($block.find(emojiSelector).length).toBe(1);
          });
      };
      it('should add selected emoji to awards block', function(done) {
        return openEmojiMenuAndAddEmoji()
          .then(done)
          .catch((err) => {
            done.fail(`Failed to open and build emoji menu: ${err.message}`);
          });
      });
      it('should remove already selected emoji', function(done) {
        return openEmojiMenuAndAddEmoji()
          .then(() => {
            $('.js-add-award').eq(0).click();
            const $block = $('.js-awards-block');
            const $emoji = $('.emoji-menu').find(`.emoji-menu-list:not(.frequent-emojis) ${emojiSelector}`);
            $emoji.click();
            expect($block.find(emojiSelector).length).toBe(0);
          })
          .then(done)
          .catch((err) => {
            done.fail(`Failed to open and build emoji menu: ${err.message}`);
          });
      });
    });

    describe('frequently used emojis', function() {
      beforeEach(() => {
        // Clear it out
        Cookies.set('frequently_used_emojis', '');
      });

      it('shouldn\'t have any "Frequently used" heading if no frequently used emojis', function(done) {
        return openAndWaitForEmojiMenu()
          .then(() => {
            const emojiMenu = document.querySelector('.emoji-menu');
            Array.prototype.forEach.call(emojiMenu.querySelectorAll('.emoji-menu-title'), (title) => {
              expect(title.textContent.trim().toLowerCase()).not.toBe('frequently used');
            });
          })
          .then(done)
          .catch((err) => {
            done.fail(`Failed to open and build emoji menu: ${err.message}`);
          });
      });

      it('should have any frequently used section when there are frequently used emojis', function(done) {
        awardsHandler.addEmojiToFrequentlyUsedList('8ball');

        return openAndWaitForEmojiMenu()
          .then(() => {
            const emojiMenu = document.querySelector('.emoji-menu');
            const hasFrequentlyUsedHeading = Array.prototype.some.call(emojiMenu.querySelectorAll('.emoji-menu-title'), title =>
              title.textContent.trim().toLowerCase() === 'frequently used'
            );

            expect(hasFrequentlyUsedHeading).toBe(true);
          })
          .then(done)
          .catch((err) => {
            done.fail(`Failed to open and build emoji menu: ${err.message}`);
          });
      });

      it('should disregard invalid frequently used emoji that are being attempted to be added', function() {
        awardsHandler.addEmojiToFrequentlyUsedList('8ball');
        awardsHandler.addEmojiToFrequentlyUsedList('invalid_emoji');
        awardsHandler.addEmojiToFrequentlyUsedList('grinning');

        expect(awardsHandler.getFrequentlyUsedEmojis()).toEqual(['8ball', 'grinning']);
      });

      it('should disregard invalid frequently used emoji already set in cookie', function() {
        Cookies.set('frequently_used_emojis', '8ball,invalid_emoji,grinning');

        expect(awardsHandler.getFrequentlyUsedEmojis()).toEqual(['8ball', 'grinning']);
      });
    });
  });
}).call(window);
