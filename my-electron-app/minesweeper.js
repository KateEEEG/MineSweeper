var minesweeper = {
	
    cellWidth:			16, 
    levels: {
        intermediate: {
			id: 2,
            rows: 16,
            cols: 16,
            mines: 40
        },
    },
	minCustomRows:		1,
	minCustomCols:		7,
	maxCustomRows:		50,
	maxCustomCols:		50,
    defaultLevel:       'intermediate',
    currentLevel:       null,
    numRows:            null, 
    numCols:            null, 
    numMines:           null,
    mineCount:          null,
    numCells:           null, 
    numRowsActual:      null, 
    numColsActual:      null, 
    target:             null, 
    cells:              [], 
    safeCells:          [], 
    mineCells:          [], 
    flagStates:         [ 'covered', 'flag', 'question' ], 
    numFlagStates:      null,
    includeMarks:       true,
    madeFirstClick:     false,
    stopTimerID:        0, 
    timer:              0,
    gameInProgress:     false,
	won:				false,
    mouseDown:          false,
    gameInitialized:    false,
   
    
    /* DOM elements */
    $windowWrapperOuter:    null,
    $resetButton:           null,
    $mineCountOnes:         null,
    $mineCountTens:         null,
    $mineCountHundreds:     null,
    $timerOnes:             null,
    $timerTens:             null,
    $timerHundreds:         null,
    $minefield:             null,
                            
//-----------------------------------
    
    init: function( targetID ) {
        var self = this;
        
       
        this.target = targetID ? '#' + targetID : 'body';
        this.numFlagStates = self.flagStates.length;
        
		
        $(this.target).append('<div id="game-container"><div id="high-score-dialog" class="window-wrapper-outer"><div class="window-wrapper-inner"><div class="window-container"><div id="high-score-dialog-content"><h2>High score!</h2></p><p><label id="high-score-name-label">Name:</label><input type="text" id="high-score-name-textbox" class="form-textbox" maxlength="20" /></p><p id="submit-high-score-container"><input type="button" value="Submit High Score" id="submit-high-score" class="form-button" /></p></div></div></div></div><div id="window-wrapper-outer" class="window-wrapper-outer"><div class="window-wrapper-inner"><div class="window-container"><div id="minesweeper-title-bar" class="title-bar"></div><div id="menu-link-container"><a id="menu-link" href="#">Game</a></div><div id="minesweeper-board-wrapper"><ul id="menu"><li id="menu-new">New</li><li class="menu-divider"></li><li id="menu-beginner" class="game-level checked">Beginner</li><li id="menu-intermediate" class="game-level">Intermediate</li><li id="menu-expert" class="game-level">Expert</li><li id="menu-custom" class="game-level">Custom…</li><li class="menu-divider"></li><li id="menu-marks" class="checked">Marks (?)</li></ul><div id="minesweeper-header-wrapper"><div id="minesweeper-header-container"><div id="minesweeper-header"><div id="mine-count" class="numbers"><div id="mine-count-hundreds" class="t0"></div><div id="mine-count-tens" class="t1"></div><div id="mine-count-ones" class="t0"></div></div><div id="minesweeper-reset-button" class="face-smile"></div><div id="timer" class="numbers"><div id="timer-hundreds" class="t0"></div><div id="timer-tens" class="t0"></div><div id="timer-ones" class="t0"></div></div></div></div></div><div id="minefield"></div></div></div></div></div></div>');

       
        this.$windowWrapperOuter =  $('#window-wrapper-outer');
        this.$resetButton =         $('#minesweeper-reset-button');
        this.$mineCountOnes =       $('#mine-count-ones');
        this.$mineCountTens =       $('#mine-count-tens');
        this.$mineCountHundreds =   $('#mine-count-hundreds');
        this.$timerOnes =           $('#timer-ones');
        this.$timerTens =           $('#timer-tens');
        this.$timerHundreds =       $('#timer-hundreds');
        this.$minefield =           $('#minefield');
		
		$('#submit-high-score').bind('click', function() {
			$(this).attr('disabled', true);
			self.submitHighScore();	
		});
        
        this.$windowWrapperOuter.bind('contextmenu dragstart drag', function() {
            return false;
        });
        
        this.$resetButton.bind('mousedown', function(e) {
            this.mouseDown = true;
            
            if (e.which === 3) {
                return false;
            }
            
            $(this).attr('class', 'face-pressed');
        }).bind('mouseup', function(e) {
            this.mouseDown = false;
            
            if (e.which === 3) {
                return false;
            }
            
            $(this).attr('class', 'face-smile');
        }).bind('mouseout', function(e) {
            if ( this.mouseDown ) {
                $(this).attr('class', 'face-smile');
            }
        }).bind('click', function(e) {
            if (e.which === 3) {
                return false;
            }
            
            self.reset();
        });
        
        this.newGame( this.defaultLevel );
        
        this.gameInitialized = true;
    }, 
    
//-----------------------------------

    newGame: function( level, numRows, numCols, numMines, resetting ) {
        var resetting = resetting || false;
        
        
        if ( this.gameInitialized ) {
            this.stop();
        }
     
        if ( resetting ) {
            var cell, 
                i,
                j;
   
            for ( i = 1; i <= this.numRows; i++ ) {
                for ( j = 1; j <= this.numCols; j++ ) {
                    cell = this.cells[i][j];
                    
                    cell.$elem.attr('class', 'covered');
                    cell.classUncovered = 'mines0';
                    cell.hasMine = false;
                    cell.numSurroundingMines = 0;
                    cell.flagStateIndex = 0; 
                }
            }
        } else { 
            
            if ( level == 'custom' ) {
                this.numRows =      numRows;
                this.numCols =      numCols;
                this.numMines =     numMines;
                this.mineCount =    numMines;
            } else {
                var levelObj =  this.levels[ level ];
                this.numRows =  levelObj.rows;
                this.numCols =  levelObj.cols;
                this.numMines = levelObj.mines;
            }
    
            this.numCells =         this.numRows * this.numCols;
            this.numRowsActual =    this.numRows + 2;
            this.numColsActual =    this.numCols + 2;
            
            this.currentLevel = level;

            
            this.$windowWrapperOuter.css('width', this.cellWidth * this.numCols + 27); 
            
          
            this.cells = new Array(this.numRowsActual);
            
            for ( i = 0; i < this.numRowsActual; i++ ) {
                this.cells[i] = new Array(this.numColsActual);
            }
            

            this.$minefield.html('');
             
            for ( i = 0; i < this.numRowsActual; i++ ) {
                for ( j = 0; j < this.numColsActual; j++ ) {
                    if ( !(i < 1 || i > this.numRows || j < 1 || j > this.numCols) ) {
                        $elem = $(document.createElement('div'))
                            .attr('class', 'covered');
                        
                        this.$minefield.append($elem);
                    } else {
                        $elem = null;
                    }
               
                    this.cells[i][j] = {
                        $elem: $elem,
                        covered: false, 
                        classUncovered: 'mines0',
                        hasMine: false,
                        numSurroundingMines: 0,
                        flagStateIndex: 0 
                    }
                }
            } 
        } 
        
        
        
        this.setMineCount( this.numMines );
        
        this.setTimer( 0 );
        
        this.layMines();        
        
      
        this.calcMineCounts();
        
        this.setClickEvents();
        
        this.madeFirstClick = false;
        
        this.$resetButton.attr('class', 'face-smile');
    }, 

//-----------------------------------
    
    setClickEvents: function() {
        for ( i = 1; i <= this.numRows; i++ ) {
            for ( j = 1; j <= this.numCols; j++ ) {
                var self = this,
                    cell = self.cells[i][j];
                
               
                cell.covered = true;
                
             
                cell.$elem.bind('mousedown', {_i: i, _j: j, _cell: cell}, function(e) {
                    self.mouseDown = true;
                    
                    var d       = e.data,
                        _cell   = d._cell;
                    
              
                    if ( _cell.covered ) {
            
                        if (e.which === 3) {
                    
                            if (_cell.flagStateIndex == 1) {
                                self.setMineCount( self.mineCount + 1 );
                            }
                            
                          
                            _cell.flagStateIndex = (_cell.flagStateIndex + 1) % self.numFlagStates;
                            
                           
                            if (_cell.flagStateIndex == 1) {
                                self.setMineCount( self.mineCount - 1 );
                            }
                            
                         
                            _cell.$elem.attr('class', self.flagStates[ (_cell.flagStateIndex) ]);
                        } else {
                         
                            
                            if ( _cell.covered && _cell.flagStateIndex !== 1) {
                                self.$resetButton.attr('class', 'face-surprised');
                                _cell.$elem.attr('class', 'mines0');
                            }
                        } 
                    } 
                }).bind('mouseover', {_cell: cell}, function(e) {
                    if (self.mouseDown) {
                        var _cell = e.data._cell;
                        _cell.$elem.mousedown();
                    }
                }).bind('mouseout', {_cell: cell}, function(e) {
                    if (self.mouseDown) {
                        var _cell = e.data._cell;                        
                        if (_cell.covered) _cell.$elem.attr('class', 'covered');
                    }
                }).bind('mouseup', {_i: i, _j: j, _cell: cell}, function(e) {
                    self.mouseDown = false;
                    
                    var d       = e.data,
                        _i      = d._i,
                        _j      = d._j,
                        _cell   = d._cell;
                        
                    self.$resetButton.attr('class', 'face-smile');
                 
                    if ( _cell.covered && _cell.flagStateIndex !== 1 ) {
                       
                        if (e.which !== 3) {

                            if (!self.madeFirstClick) {
                                self.madeFirstClick = true;
                                self.start();
                                
                                
                                if (_cell.hasMine) {
                                    self.moveMine( _i, _j );
                                }
                            } 
                            if (_cell.hasMine) {
                                _cell.classUncovered = 'mine-hit';
                                self.lose();
                            } else {
                                self.revealCells( _i, _j );
                                
                              
                                if ( self.checkForWin() ) {
                                    self.win();
                                }  
                            }
                        } 
                    } 
                }); 
            } 
        } 
    }, 
    
//-----------------------------------    
    
    layMines: function() {
        var rowCol,
            cell,
            i;
    
        this.designateMineSpots();
        
        for ( i = 0; i < this.numMines; i++ ) {
            rowCol = this.numToRowCol( this.mineCells[i] );
            cell = this.cells[ rowCol[0] ][ rowCol[1] ];            
            cell.hasMine = true;
            cell.classUncovered = 'mine';
        }
    },

//-----------------------------------
        
    designateMineSpots: function() {
        this.safeCells = [];
        this.mineCells = []
        
        var i,
            randIndex;

        i = this.numCells;
        while ( i-- ) {
            this.safeCells.push( i + 1 );
        }
        
        i = this.numMines;
        while ( i-- ) {
            randIndex = -~( Math.random() * this.safeCells.length ) - 1;
            this.mineCells.push( this.safeCells[randIndex] );
            this.safeCells.splice( randIndex, 1 ); 
        }        
    },
    
//-----------------------------------    

    calcMineCount: function( row, col ) {
        var count = 0,
            cell = this.cells[row][col],
            i, 
            j;
        
        for (i = row - 1; i <= row + 1; i++) {
            for (j = col - 1; j <= col + 1; j++) {
                if (i == row && j == col) { continue; }
                
                if (this.cells[i][j].hasMine) { count++; }
            }
        }
        
        cell.numSurroundingMines = count;
        
        if (!cell.hasMine) { 
            cell.classUncovered = 'mines' + count;
        }
    },
    
//-----------------------------------
    calcMineCounts: function() {
        for ( var i = 1; i <= this.numRows; i++ ) {
            for ( var j = 1; j <= this.numCols; j++ ) {
                this.calcMineCount( i, j );
            }
        }
    },

//-----------------------------------

    changeMineCount: function( row, col, numToAdd ) {
        var numToAdd = numToAdd || 1,
            cell = this.cells[row][col];
            newMineCount = cell.numSurroundingMines + numToAdd;
        
        cell.numSurroundingMines = newMineCount;
        
        if (!cell.hasMine) {
            cell.classUncovered = 'mines' + newMineCount;
        }
    },

//-----------------------------------

    changeSurroundingMineCounts: function( row, col, numToAdd ) {
        for (i = row - 1; i <= row + 1; i++) {
            for (j = col - 1; j <= col + 1; j++) {
                if (i == row && j == col) continue;
                
                this.changeMineCount( i, j, numToAdd );
            }
        }
    },
    
//-----------------------------------
    
    moveMine: function( row, col ) {
        var cell = this.cells[row][col],
            spot = this.rowColToNum( row, col );
        
        cell.hasMine = false;
        cell.classUncovered = 'mines' + cell.numSurroundingMines;
        
        this.mineCells.splice( $.inArray(spot, this.mineCells), 1 );
        this.safeCells.push( spot );

        this.changeSurroundingMineCounts( row, col, -1 );
        

        var newIndex    = -~( Math.random() * this.safeCells.length ) - 1,
            newSpot     = this.safeCells[newIndex],
            newRowCol   = this.numToRowCol( newSpot ),                                  
            newMineCell = this.cells[ newRowCol[0] ][ newRowCol[1] ];

        newMineCell.hasMine = true;
        newMineCell.classUncovered = 'mine';
        
        this.safeCells.splice( $.inArray(newSpot, this.safeCells), 1 );
        this.mineCells.push( newSpot );

        this.changeSurroundingMineCounts( newRowCol[0], newRowCol[1], 1 );
    },

//-----------------------------------

    revealMines: function( won ) {
        var cell,
            rowCol,
            won = won || false;
            i,
            j;
        
        
        for ( i = 0; i < this.numMines; i++ ) {
            rowCol = this.numToRowCol( this.mineCells[i] );
            cell = this.cells[ rowCol[0] ][ rowCol[1] ];
            
            if ( won ) {
            
                if ( cell.flagStateIndex !== 1 ) {
                    cell.flagStateIndex = 1;
                    cell.$elem.attr('class', 'flag');
                }
            } else {
               
                if ( cell.flagStateIndex === 1 && !cell.hasMine) {
                    cell.$elem.attr('class', 'mine-misflagged');
                } else if ( cell.hasMine ) {
                    cell.$elem.attr('class', cell.classUncovered);
                }
            }
        }
    },
    
//-----------------------------------

    flagMines: function() {
        this.revealMines( true );
    },

//-----------------------------------
    

    revealCells: function( row, col ) {
        var cell = this.cells[row][col],
            testCell,
            i,
            j;
        
        
        cell.$elem.attr('class', cell.classUncovered);
        cell.covered = false;
        
        if (cell.numSurroundingMines > 0) {
            return;
        } else {
            
            for (i = row - 1; i <= row + 1; i++) {
                for (j = col - 1; j <= col + 1; j++) {
                    if (i == row && j == col) continue;
                    
                    testCell = this.cells[i][j];
                    if (!testCell.covered) {
                        continue;
                    }
                    
                    this.revealCells( i, j );                    
                }
            } 
        } 
    },

//-----------------------------------

    toggleMarks: function() {
        if ( this.includeMarks ) {
            this.includeMarks = false;
            this.flagStates.splice( this.flagStates.length - 1, 1 );
        } else {
            this.includeMarks = true;
            this.flagStates.push( 'question' );
        }
        
        this.numFlagStates = this.flagStates.length;
    },
	
//-----------------------------------
    
    numToRowCol: function( num ) {
        return [ Math.ceil(num/this.numCols), (num % this.numCols) || this.numCols ];
    },

//-----------------------------------
    
    rowColToNum: function( row, col ) {
        return (row - 1) * this.numRows + col;
    },

//-----------------------------------

    start: function() {
        this.gameInProgress = true;
        this.setTimer( 1 ); 
        this.runTimer();
    },

//-----------------------------------

    stop: function() {
        this.stopTimer();
        this.gameInProgress = false;
        
        for ( var i = 1; i <= this.numRows; i++ ) {
            for ( var j = 1; j <= this.numCols; j++ ) {
                this.cells[i][j].$elem.unbind('click mouseup mousedown');
            }
        }
    },
    
//-----------------------------------

    reset: function() {
        this.newGame( null, null, null, null, true );
    },
    
//-----------------------------------

    setTimer: function( num, settingMineCount ) {
        var settingMineCount = settingMineCount || false,
            onesElem =      settingMineCount ? this.$mineCountOnes      : this.$timerOnes,
            tensElem =      settingMineCount ? this.$mineCountTens      : this.$timerTens,
            hundredsElem =  settingMineCount ? this.$mineCountHundreds  : this.$timerHundreds,
            ones = Math.abs( num % 10 ),
            tens = Math.abs( (num / 10) % 10 | 0 ),
            hundreds = num < 0 ? 'm' : ( (num / 100) % 10 | 0 );
        
        if ( settingMineCount ) {
            this.mineCount = num;
        } else {
            this.timer = num;
        }
        
        onesElem.attr('class', 't' + ones);
        tensElem.attr('class', 't' + tens);
        hundredsElem.attr('class', 't' + hundreds);
    },

//-----------------------------------

    setMineCount: function( num ) {
        this.setTimer( num, true );
    },

//-----------------------------------

    runTimer: function() {
        var self = this;
        
        this.stopTimerID = setTimeout(function() {
            if ( self.gameInProgress ) {
                if (self.timer > 998) {
                    self.lose();
                    return;
                }
                
                self.setTimer( ++self.timer );
                
                self.runTimer();
            }
        }, 1000);
    },

//-----------------------------------

    stopTimer: function() {
        clearTimeout( this.stopTimerID );
    },
    
//-----------------------------------

    lose: function() {
        this.stop();
        this.revealMines();
        this.$resetButton.attr('class', 'face-sad');
    },
    
//-----------------------------------

    checkForWin: function() {
        var openCells = 0;
        
        for ( var i = 1; i <= this.numRows; i++ ) {
            for ( var j = 1; j <= this.numCols; j++ ) {
                if ( !this.cells[i][j].covered ) openCells++;
            }
        }
        
        return openCells === this.numCells - this.numMines;
    },
    
//-----------------------------------

    win: function() {
		this.won = true;
		this.stop();
		this.flagMines();
        this.$resetButton.attr('class', 'face-sunglasses');
        this.setMineCount( 0 );
		
		var self = this,
			levelId = 1;
    },
	
//-----------------------------------

	displayHighScoreDialog: function() {
		$('#submit-high-score').attr('disabled', false);
		$('#high-score-dialog').show();
	},
	
//-----------------------------------

	submitHighScore: function() {
		if (!this.won) {
			return;
		}
		
		var self = this,
			name = $('#high-score-name-textbox').val(),
			levelId = 1; 
		
	},
	
};

$(document).ready(function() {
	minesweeper.init('game');
});