/* Every word of prose and every effect value in Underwater.

   This file contains no logic. It is loaded with a <script> tag rather than
   fetched as JSON on purpose: fetch() is blocked on file:// URLs, and the game
   has to play by double-clicking index.html with no server in the way.

   House style for numbers: digits, for cardinals and ordinals alike — "€14,000",
   "30 months", "81 minutes", "the 4th of the month", "a 2nd van" — because this
   is a game about arithmetic and the figures should read as figures. Only words
   that are not really figures stay as words: "once", "twice", "a single cent",
   and "one" used as an article or pronoun ("one Saturday").

   Effect keys are checked against State.NUMERIC_KEYS by tools/checks.html. A
   typo here fails silently in the game and loudly in that tool, so run it after
   editing this file. */
(function (global) {
  'use strict';

  global.SCRIPT = {

    /* The opening is a picture over the prose. The drawing itself lives in the
       <template id="intro-art"> in index.html, because artwork is neither prose
       nor a rule; what belongs here is the writing attached to it.

       `alt` describes the picture and nothing more. It carried the whole
       premise while the image stood alone; now that the text is underneath it
       again, repeating the premise there would read it out twice to anyone
       using a screen reader. The art sets the mood, the prose states the facts,
       and the label covers only what is lost by not seeing it. */
    intro: {
      art: 'intro-art',
      alt: 'A refrigerated van in front of your building gathering dust on a quay at night, its business name showing faintly through the cover. Along from it a car waits with its headlights on. Below the waterline, the figure €14,000.',
      title: null,
      body: [
        '€14,000 bought you a refrigerated van. It was supposed to buy you freedom.',
        'Your own routes. Your own hours. Your own name printed in vinyl along the side. Fish from the docks to the restaurants. No boss. No clock. No one telling you where to be.',
        'You believed that part 💀',
        'Nothing exploded. Nobody robbed you. There was no single disaster you could point to and say, There. That\'s where everything went wrong. The numbers simply refused to work. 📉',
        'One bad month became 3. 3 became 12. Every time you thought you were close, another payment came due. Another repair. Another bill.',
        'Eventually, you stopped calling it your business. The van sits in front of your building gathering dust.',
        'Every 4th of the month, Luca \'The Undertaker\' parks outside. He waits until you finish your shift, and you already know what happens next. 😨',
        '30 months to survive under water. 30 months before you find out what happens when it doesn\'t. 💀'
      ],
      button: 'Begin'
    },

    /* The creditor's face is chosen from the murk value, not from the month, so
       a player who keeps their numbers under control genuinely never meets the
       later versions of him. */
    chapters: [
      { id: 'ch1', title: 'The Arrangement', creditor: 'A tired man in a cold car' },
      { id: 'ch2', title: 'Running Costs', creditor: 'A tired man in a cold car' }
    ],

    beats: [

      /* ---------------------------------------------------------------- */
      /* Chapter one. The trap is not closed yet and the player has real   */
      /* room to move — that is the point. Everything that goes wrong from */
      /* here is something they can trace back to a specific month.        */
      /* ---------------------------------------------------------------- */

      {
        id: 'c1-arrangement',
        chapter: 'ch1',
        month: 1,
        kind: 'situation',
        title: 'The 4th of the Month',
        body: [
          'Luca "The Undertaker" does not get out of the car. He lowers the window and holds up the notebook so you can see your own handwriting on the 1st page, from 18 months ago.',
          '"4%," he says, the way a man says the weather. "On 14,000. You know what that is."',
          'You do. It is €560 a month before a single cent of what you actually owe him moves at all.'
        ],
        choices: [
          {
            id: 'c1-arrangement-pay',
            label: 'Hand him what you have on you',
            hint: 'Costs €300, straight off the balance. He will remember it.',
            /* The debt has to come down with the cash. This is the one choice in
               the game where the player hands money directly to the lender
               rather than spending it on something, and without the matching
               `debt` the €300 simply evaporated: it left the pocket, never
               reached the balance, and only reduced what was available for the
               automatic payment at month end. Paying him was strictly worse than
               refusing. */
            effects: { cash: -300, debt: -300, composure: 1 },
            weight: 1,
            image: 'assets/image/chp1-1.jpg',
            imageAlt: 'Seen from inside his car in the rain, you reach in through the window, wide-eyed, toward a gloved hand holding a fan of euro notes. A cigar glows in the dark of the back seat, smoke curling, a baseball bat leaning against the dashboard.',
            outcome: 'He counts it twice, writes a number in the notebook, and nods once. It is not gratitude. But the window goes up slowly rather than fast, and you find you are grateful for the difference.'
          },
          {
            id: 'c1-arrangement-wait',
            label: 'Tell him it will come at the end of the month',
            hint: 'Costs nothing today.',
            effects: { composure: -1 },
            image: 'assets/image/chp1-2.jpg',
            imageAlt: 'A rain-soaked car park at night. You stand under a streetlamp, wide-eyed, looking from a scrap of paper reading 14,000 euros to a phone showing your total debt. Behind you, his black car idles with its taillights lit.',
            outcome: '"It will," he agrees, and that is worse than an argument. He writes something anyway. You stand in the car park for a while after he has gone, doing sums that you already know the answer to.'
          },
          {
            id: 'c1-arrangement-ask',
            label: 'Ask him to put the rate down',
            hint: 'Requires a clear head.',
            requires: { composure: { min: 6 } },
            effects: { composure: -1, self: 1 },
            weight: 1,
            image: 'assets/image/chp1-3.jpeg',
            imageAlt: 'In the rain-soaked car park, Luca stands over you in a long dark coat, one hand raised, speaking. You look up at him, hat gripped in your hands. His black car idles behind.',
            outcome: 'He looks at you properly for the 1st time in a year. "You are the 4th person to ask me that this month," he says. "I say the same thing to all of you. The rate is not the problem. The rate is just the part you can see."'
          }
        ]
      },

      {
        id: 'c1-birthday',
        chapter: 'ch1',
        month: 2,
        kind: 'situation',
        title: 'Teresa Is 50',
        body: [
          'Your sister has booked a birthday dinner at the restaurant. 11 friends and family have said yes.',
          'That same weekend, your employer puts a sheet on the noticeboard at the office. Extra shifts on the weekend, Saturday and Sunday. €260 for the 2 days, paid in cash the Friday after.',
          'There are 4 places on the sheet. 3 of them are already taken.'
        ],
        choices: [
          {
            id: 'c1-birthday-work',
            label: 'Put your name on the sheet',
            hint: '+€260. Teresa will understand.',
            effects: { cash: 260, standing: -1, composure: -1 },
            image: 'assets/image/chp2-1.jpg',
            imageAlt: 'Your own hands holding a phone at 11:03 at night. On the screen Teresa has sent a photograph of the long table — everyone leaning in, glasses and plates between them — under a message reading "Next time!" Behind the phone your laptop is still open on a timesheet: Saturday 14hrs, Sunday 9hrs.',
            outcome: 'You do 14 hours on Saturday and 9 on Sunday. Teresa sends you a photograph of the table at 11 at night, everyone leaning in, a gap at the end where a chair was not needed. She has written *next time!* with an exclamation mark, which she does not normally use.'
          },
          {
            id: 'c1-birthday-go',
            label: 'Go to the dinner',
            hint: 'Costs about €40.',
            effects: { cash: -40, standing: 1, self: 1 },
            weight: 1,
            image: 'assets/image/chp2-2.jpg',
            imageAlt: 'Seen from behind the cake: your own hands carry it in from the doorway, 50 in lit candles on top, smoke curling up toward the chandeliers. Teresa is dabbing her eyes with a napkin and smiling at you, friends and family leaning in around her. Through the rain-streaked glass behind you, your van sits at the kerb in the dark.',
            outcome: 'You are the one who ends up carrying the cake. Teresa cries a bit. It costs you €40 and 1 Saturday (€260 forgone). You cannot make the math say to yourself "it was worth it anyway. Anything to my beloved sister".'
          },
          {
            id: 'c1-birthday-hide',
            label: 'Go, and tell everyone the business is doing well',
            hint: 'Costs about €40.',
            effects: { cash: -40, standing: 1, self: -1 },
            weight: 2,
            outcome: 'You are good at lying. The fluency. You did not have to invent anything. How easily it came out. How the details arrived ready-made. 2 new restaurant clients. To buy a 2nd van in the spring. Your cousin asks for a card and you say you have run out.'
          }
        ]
      },

      {
        id: 'c1-first-bet',
        chapter: 'ch1',
        month: 3,
        kind: 'opportunity',
        title: 'Marek Has a Feeling',
        body: [
          'Marek loads the 4 a.m. run with his phone wedged in the pallet rack, and tonight he wants you to look at it. 2 teams you have vaguely heard of. The number beside them is large and green.',
          '"Double your money," he says. "I am not saying it is free. I am saying I have a feeling."',
          'The app takes about 40 seconds to sign up for. You know this because you watch him do it for you.'
        ],
        choices: [
          {
            id: 'c1-first-bet-in',
            label: 'Put something on it',
            hint: 'Doubles if it comes in, but you doubt it.',
            wager: { multiplier: 2, stake: 'suggested', base: 150, scripted: 'win' },
            effects: { composure: 1 },
            weight: 2,
            outcomeWin: 'It comes in at 87 minutes. Marek shouts so loudly that you nearly drive off the road. The money is in the account before you have finished the shift, not in 3 days, now. You sit in the depot car park at 6 a.m. looking at a number that took you 90 seconds to earn instead of 9 hours.\n\nYou think: that was luck. You think it clearly and honestly, and then you put the phone in your pocket, and part of you moves the thought somewhere it will not stop you next time.',
            outcomeLose: 'Nothing. The match ends and the number goes grey.'
          },
          {
            id: 'c1-first-bet-out',
            label: 'Tell him you are not doing that',
            hint: 'Nothing happens.',
            /* Refusing costs nerve, which is the point: the regret in the
               outcome is real, and a rattled player is offered a larger stake
               the next time one is going. Doing the right thing here genuinely
               does make the next bet harder to refuse. */
            effects: { self: 1, composure: -1 },
            weight: 2,
            outcome: 'Marek goes back to his phone. At 6 a.m. he shows you the score with the reverence of a man showing you his newborn, and you say well done, and you mean it, and you drive home. Nothing happened. It is remarkable how much nothing that is.\n\nOn the drive home you work out what you would have won. You already know the number. You work it out again anyway, and again at the lights, and it is still there when you are trying to sleep.'
          }
        ]
      },

      {
        id: 'c1-sister-asks',
        chapter: 'ch1',
        month: 4,
        kind: 'question',
        title: 'She Asks You Directly',
        body: [
          'Teresa comes by with a tray of food. She is looking at the van in the yard, under its cover. The rain has pulled the cover tight, and your name shows through it.',
          '"I am going to ask you once," she says, "and then I will leave it. How bad is it?"'
        ],
        choices: [
          {
            id: 'c1-sister-truth',
            label: 'Tell her the actual number',
            effects: { self: 2, standing: 1, composure: 1 },
            flags: ['disclosed'],
            weight: 3,
            outcome: 'You say 14,000 and then, because saying it once did not kill you, you say 4% a month as well, and who it is owed to.\n\nShe does not gasp and she does not offer you money, which are the 2 things you had braced for. She sits down on the step and says, "Okay." Then, after a while: "Okay. That is a real thing. I hate it, but it is a real thing, and I would rather know a real thing."\n\nSomething goes out of your shoulders that you did not know was being held there.'
          },
          {
            id: 'c1-sister-deflect',
            label: '"It is manageable."',
            effects: { self: -1 },
            weight: 1,
            outcome: '"Manageable," she repeats, testing the word, and you can hear her deciding not to push. She leaves the tray. You stand at the window and watch her get into her car and sit there for a full minute before pulling away.'
          },
          {
            id: 'c1-sister-inflate',
            label: '"It is turning a corner, actually."',
            effects: { self: -2, standing: 1 },
            weight: 2,
            outcome: 'You hear yourself describe a contract that does not exist. She is so pleased. That is the unbearable part — she is so straightforwardly, uncomplicatedly pleased for you, and she hugs you on the way out, and you have to stand very still until she is gone.'
          }
        ]
      },

      {
        id: 'c1-compressor',
        chapter: 'ch1',
        month: 5,
        kind: 'situation',
        title: 'The Compressor',
        body: [
          'The van is still yours. It is the only thing you got out of it that is still yours, and twice a month you take a private job in it — a restaurant, a wedding, someone\'s cousin\'s catering — and those jobs are the difference between the sums working and not.',
          'The compressor has gone. €900 with the part, says Abel, who has never once padded a bill in 11 years.'
        ],
        choices: [
          {
            id: 'c1-compressor-pay',
            label: 'Pay Abel',
            hint: '-€900. The van keeps earning.',
            effects: { cash: -900 },
            outcome: 'It takes most of what you have and it hurts in a clean way, the way a thing hurts when you are quite sure it was correct. Abel does it in a day and charges you what he said he would.'
          },
          {
            id: 'c1-compressor-luca',
            label: 'Let Luca "The Undertaker" cover it',
            hint: '+€900 onto the balance. He will adjust the rate.',
            tags: ['loan'],
            effects: { debt: 900, composure: -1 },
            weight: 3,
            outcome: '"Of course," he says, and that is all. The money is with Abel by lunchtime and the van is running by Thursday, and you notice how easy it was, how completely frictionless, and you understand for the 1st time that the ease is the product. He is not selling you €900. He is selling you not having to feel this today.'
          },
          {
            id: 'c1-compressor-run',
            label: 'Run the jobs cold-packed and say nothing',
            hint: 'Costs nothing. Nobody checks. Usually.',
            effects: { exposure: 18, composure: -1 },
            tags: ['greed'],
            weight: 2,
            outcome: 'Ice packs and blankets and a fast route. It works. The fish arrives at 11 degrees instead of 4 and a chef in Almada signs the sheet without looking at it, and you drive home having saved €900 by doing nothing at all.\n\nYou do the same thing the following week.'
          }
        ]
      },

      {
        id: 'c1-writeoffs',
        chapter: 'ch1',
        month: 6,
        kind: 'situation',
        title: 'Written Off',
        body: [
          'Halberd writes off a pallet a week — chilled stock that has broken temperature on paper, whatever the paper says. It goes in the skip. Everyone knows it goes in the skip, and everyone knows that Vitor does not put it in the skip.',
          'He catches you watching him load 4 boxes into his own boot and, instead of flinching, he holds one out to you. "It is written off," he says, reasonably. "It does not exist. You cannot steal a thing that does not exist."'
        ],
        choices: [
          {
            id: 'c1-writeoffs-take',
            label: 'Take a share',
            hint: 'About €400 a month. Nobody is counting.',
            effects: { cash: 400, exposure: 20, self: -1 },
            tags: ['greed'],
            weight: 2,
            outcome: '€400 in the 1st month, sold on to 2 places that do not ask questions. It is the easiest money you have ever handled and it slides straight into the hole without touching the sides.\n\nVitor is right, is the thing. It does not exist. You check the argument for holes several times over the following weeks and you cannot find one, and you keep checking, which ought to tell you something.'
          },
          {
            id: 'c1-writeoffs-decline',
            label: 'Say no and keep his secret',
            effects: { self: 1 },
            weight: 2,
            outcome: '"Suit yourself," says Vitor, and he is not angry, and nothing changes between you. You go back to the cab €400 poorer than you could have been, with nothing to show for it except that you are a person who did not.\n\nThat has to be worth something. You spend a fair amount of the drive home trying to work out how much.'
          },
          {
            id: 'c1-writeoffs-report',
            label: 'Tell the shift manager',
            hint: 'Requires a clear head.',
            requires: { composure: { min: 5 } },
            effects: { standing: -2, self: 2, composure: 1 },
            weight: 3,
            outcome: 'Vitor is gone by Wednesday. He has 2 children and a sick mother in Setúbal and everyone on the night shift knows exactly who put the note under the door, and for the next fortnight the cab is loaded in silence.\n\nYou were right. You have never been so sure of being right, and it has never bought you less.'
          }
        ]
      }
    ],

    /* --------------------------------------------------------------- */
    /* Engine-raised cards. The rules that trigger these live in        */
    /* assets/js/, but the words belong here with everything else.      */
    /* --------------------------------------------------------------- */

    system: {

      crisis: {
        title: 'Short',
        body: [
          'The minimum is due on the 4th and the money is not there. It is not nearly there. You count it twice on the kitchen table, in coins at the end, which is how you know how this month has gone.'
        ],
        choices: [
          {
            id: 'crisis-miss',
            label: 'Let it go past',
            hint: 'He adds 2 points to the rate. Permanently.',
            outcome: 'No phone call. No visit. On the 5th a photograph arrives of a page of the notebook with a new figure on it, and the new figure is the old figure with 2 more points of interest running underneath it for the rest of the arrangement.\n\nThat is the whole punishment. He does not need to do anything else.'
          },
          {
            id: 'crisis-borrow',
            label: 'Borrow the shortfall from him to pay him',
            hint: 'The gap goes on the balance, and the rate goes up.',
            outcome: 'You say it out loud in the car park and you hear how it sounds — borrowing money from a man to give the money back to the same man — and he does not laugh at you, which somehow makes it worse. The paperwork takes 90 seconds. He has the form with him. He always has the form with him.'
          }
        ]
      },

      /* Severity is chosen by accumulated exposure, so the player who took one
         shortcut and the player who took six are in different trouble. */
      collection: {
        minor: [
          {
            id: 'coll-minor-chef',
            title: 'A Chef Reads the Label',
            body: 'The place in Almada has a new head chef and the new head chef puts a probe in the box on the loading step, in front of you, and reads the number out loud. He does not shout. He cancels the standing order and walks back inside.',
            effects: { income: -120, composure: -1 }
          },
          {
            id: 'coll-minor-audit',
            title: 'A Spot Check',
            body: 'Halberd runs an unannounced stock count on the night shift. Nothing lands on you. But the counting takes 4 hours, and the man doing it looks at you twice, and you do not sleep well for a week afterwards.',
            effects: { composure: -2 }
          }
        ],
        serious: [
          {
            id: 'coll-serious-fine',
            title: 'Environmental Health',
            body: 'The letter uses the phrase *cold chain integrity* 4 times. The fine is €1,100 and there is a 2nd paragraph, about what happens if there is a 2nd letter.',
            effects: { cash: -1100, composure: -2 }
          },
          {
            id: 'coll-serious-contract',
            title: 'The Private Jobs Dry Up',
            body: 'Nobody says anything. That is how it is done — one caterer stops calling, then the wedding people, then the restaurant that had used you for 2 years, and by the time you understand it is not a coincidence there is nothing left to apologise to.',
            effects: { income: -260, standing: -1, composure: -1 }
          }
        ],
        severe: [
          {
            id: 'coll-severe-suspended',
            title: 'Suspended Pending Investigation',
            body: 'They do it properly: a room, a printed sheet of dates, a woman from head office who is scrupulously polite. 2 of the dates are dates you cannot account for. You are on half pay until it concludes, and nobody will say how long that is.',
            effects: { income: -700, standing: -2, composure: -3 }
          },
          {
            id: 'coll-severe-vitor',
            title: 'Vitor Gives a Statement',
            body: 'He is not vindictive about it. He is just further along the same road than you are, and when they offered him a way to carry less of it he took the way, and your name was part of the price. You would like to be able to say you would not have.',
            effects: { cash: -600, standing: -3, composure: -2 }
          }
        ]
      },

      statement: {
        interest: 'interest',
        paid: 'paid',
        balance: 'balance',
        missed: 'missed — rate up',
        borrowed: 'borrowed to pay'
      },

      projection: {
        prefix: 'Clear by',
        never: 'Never, at this rate'
      }
    },

    /* Placeholder terminal card for the chapter-one build. Replaced by the real
       endings in step 4. */
    endings: [
      {
        id: 'interlude',
        title: 'End of Chapter 1',
        body: [
          '6 months gone. 24 to go — and this is where the build currently stops.',
          'Everything under this line is the real state of your run. The numbers are not decoration; they are what the remaining chapters will be played against.'
        ]
      }
    ]
  };
})(window);
