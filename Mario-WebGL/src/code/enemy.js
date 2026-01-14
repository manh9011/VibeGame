/**
 * A generic template for an enemy in the game.
 * Code by Rob Kleffner, 2011
 * Refactored to ES Module
 */

import { NotchSprite } from './notchSprite.js';
import { Resources } from '../Enjine/resources.js';
import { Sparkle } from './sparkle.js';
import { Shell } from './shell.js';
import { Mario } from './setup.js';

export class Enemy extends NotchSprite {
    constructor(world, x, y, dir, type, winged) {
        super(null);
        this.GroundInertia = 0.89;
        this.AirInertia = 0.89;
        this.RunTime = 0;
        this.OnGround = false;
        this.MayJump = false;
        this.JumpTime = 0;
        this.XJumpSpeed = 0;
        this.YJumpSpeed = 0;
        this.Width = 4;
        this.Height = 24;
        this.DeadTime = 0;
        this.FlyDeath = false;
        this.WingTime = 0;
        this.NoFireballDeath = false;

        this.X = x;
        this.Y = y;
        this.World = world;

        this.Type = type;
        this.Winged = winged;

        this.Image = Resources.Images["enemies"];

        this.XPicO = 8;
        this.YPicO = 31;
        this.AvoidCliffs = this.Type === Enemy.RedKoopa;
        this.NoFireballDeath = this.Type === Enemy.Spiky;

        this.YPic = this.Type;
        if (this.YPic > 1) {
            this.Height = 12;
        }
        this.Facing = dir;
        if (this.Facing === 0) {
            this.Facing = 1;
        }

        this.PicWidth = 16;
    }

    CollideCheck() {
        if (this.DeadTime !== 0) {
            return;
        }

        var xMarioD = Mario.MarioCharacter.X - this.X, yMarioD = Mario.MarioCharacter.Y - this.Y;

        if (xMarioD > -this.Width * 2 - 4 && xMarioD < this.Width * 2 + 4) {
            if (yMarioD > -this.Height && yMarioD < Mario.MarioCharacter.Height) {
                if (this.Type !== Enemy.Spiky && Mario.MarioCharacter.Ya > 0 && yMarioD <= 0 && (!Mario.MarioCharacter.OnGround || !Mario.MarioCharacter.WasOnGround)) {
                    Mario.MarioCharacter.Stomp(this);
                    if (this.Winged) {
                        this.Winged = false;
                        this.Ya = 0;
                    } else {
                        this.YPicO = 31 - (32 - 8);
                        this.PicHeight = 8;

                        if (this.SpriteTemplate !== null) {
                            this.SpriteTemplate.IsDead = true;
                        }

                        this.DeadTime = 10;
                        this.Winged = false;

                        if (this.Type === Enemy.RedKoopa) {
                            this.World.AddSprite(new Shell(this.World, this.X, this.Y, 0));
                        } else if (this.Type === Enemy.GreenKoopa) {
                            this.World.AddSprite(new Shell(this.World, this.X, this.Y, 1));
                        }
                    }
                } else {
                    Mario.MarioCharacter.GetHurt();
                }
            }
        }
    }

    Move() {
        var i = 0, sideWaysSpeed = 1.75, runFrame = 0;

        this.WingTime++;
        if (this.DeadTime > 0) {
            this.DeadTime--;

            if (this.DeadTime === 0) {
                this.DeadTime = 1;
                for (i = 0; i < 8; i++) {
                    this.World.AddSprite(new Sparkle(this.World, ((this.X + Math.random() * 16 - 8) | 0) + 4, ((this.Y - Math.random() * 8) | 0) + 4, Math.random() * 2 - 1, Math.random() * -1, 0, 1, 5));
                }
                this.World.RemoveSprite(this);
            }

            if (this.FlyDeath) {
                this.X += this.Xa;
                this.Y += this.Ya;
                this.Ya *= 0.95;
                this.Ya += 1;
            }
            return;
        }

        if (this.Xa > 2) {
            this.Facing = 1;
        }
        if (this.Xa < -2) {
            this.Facing = -1;
        }

        this.Xa = this.Facing * sideWaysSpeed;

        this.MayJump = this.OnGround;

        this.XFlip = this.Facing === -1;

        this.RunTime += Math.abs(this.Xa) + 5;

        runFrame = ((this.RunTime / 20) | 0) % 2;

        if (!this.OnGround) {
            runFrame = 1;
        }

        if (!this.SubMove(this.Xa, 0)) {
            this.Facing = -this.Facing;
        }
        this.OnGround = false;
        this.SubMove(0, this.Ya);

        this.Ya *= this.Winged ? 0.95 : 0.85;
        if (this.OnGround) {
            this.Xa *= this.GroundInertia;
        } else {
            this.Xa *= this.AirInertia;
        }

        if (!this.OnGround) {
            if (this.Winged) {
                this.Ya += 0.6;
            } else {
                this.Ya += 2;
            }
        } else if (this.Winged) {
            this.Ya = -10;
        }

        if (this.Winged) {
            runFrame = ((this.WingTime / 4) | 0) % 2;
        }

        this.XPic = runFrame;
    }

    SubMove(xa, ya) {
        var collide = false;

        while (xa > 8) {
            if (!this.SubMove(8, 0)) {
                return false;
            }
            xa -= 8;
        }
        while (xa < -8) {
            if (!this.SubMove(-8, 0)) {
                return false;
            }
            xa += 8;
        }
        while (ya > 8) {
            if (!this.SubMove(0, 8)) {
                return false;
            }
            ya -= 8;
        }
        while (ya < -8) {
            if (!this.SubMove(0, -8)) {
                return false;
            }
            ya += 8;
        }

        if (ya > 0) {
            if (this.IsBlocking(this.X + xa - this.Width, this.Y + ya, xa, 0)) {
                collide = true;
            } else if (this.IsBlocking(this.X + xa + this.Width, this.Y + ya, xa, 0)) {
                collide = true;
            } else if (this.IsBlocking(this.X + xa - this.Width, this.Y + ya + 1, xa, ya)) {
                collide = true;
            } else if (this.IsBlocking(this.X + xa + this.Width, this.Y + ya + 1, xa, ya)) {
                collide = true;
            }
        }
        if (ya < 0) {
            if (this.IsBlocking(this.X + xa, this.Y + ya - this.Height, xa, ya)) {
                collide = true;
            } else if (collide || this.IsBlocking(this.X + xa - this.Width, this.Y + ya - this.Height, xa, ya)) {
                collide = true;
            } else if (collide || this.IsBlocking(this.X + xa + this.Width, this.Y + ya - this.Height, xa, ya)) {
                collide = true;
            }
        }

        if (xa > 0) {
            if (this.IsBlocking(this.X + xa + this.Width, this.Y + ya - this.Height, xa, ya)) {
                collide = true;
            }
            if (this.IsBlocking(this.X + xa + this.Width, this.Y + ya - ((this.Height / 2) | 0), xa, ya)) {
                collide = true;
            }
            if (this.IsBlocking(this.X + xa + this.Width, this.Y + ya, xa, ya)) {
                collide = true;
            }

            if (this.AvoidCliffs && this.OnGround && !this.World.Level.IsBlocking(((this.X + this.Xa + this.Width) / 16) | 0, ((this.Y / 16) + 1) | 0, this.Xa, 1)) {
                collide = true;
            }
        }
        if (xa < 0) {
            if (this.IsBlocking(this.X + xa - this.Width, this.Y + ya - this.Height, xa, ya)) {
                collide = true;
            }
            if (this.IsBlocking(this.X + xa - this.Width, this.Y + ya - ((this.Height / 2) | 0), xa, ya)) {
                collide = true;
            }
            if (this.IsBlocking(this.X + xa - this.Width, this.Y + ya, xa, ya)) {
                collide = true;
            }

            if (this.AvoidCliffs && this.OnGround && !this.World.Level.IsBlocking(((this.X + this.Xa - this.Width) / 16) | 0, ((this.Y / 16) + 1) | 0, this.Xa, 1)) {
                collide = true;
            }
        }

        if (collide) {
            if (xa < 0) {
                this.X = (((this.X - this.Width) / 16) | 0) * 16 + this.Width;
                this.Xa = 0;
            }
            if (xa > 0) {
                this.X = (((this.X + this.Width) / 16 + 1) | 0) * 16 - this.Width - 1;
                this.Xa = 0;
            }
            if (ya < 0) {
                this.Y = (((this.Y - this.Height) / 16) | 0) * 16 + this.Height;
                this.JumpTime = 0;
                this.Ya = 0;
            }
            if (ya > 0) {
                this.Y = (((this.Y - 1) / 16 + 1) | 0) * 16 - 1;
                this.OnGround = true;
            }

            return false;
        } else {
            this.X += xa;
            this.Y += ya;
            return true;
        }
    }

    IsBlocking(x, y, xa, ya) {
        x = (x / 16) | 0;
        y = (y / 16) | 0;

        if (x === (this.X / 16) | 0 && y === (this.Y / 16) | 0) {
            return false;
        }

        return this.World.Level.IsBlocking(x, y, xa, ya);
    }

    ShellCollideCheck(shell) {
        if (this.DeadTime !== 0) {
            return false;
        }

        var xd = shell.X - this.X, yd = shell.Y - this.Y;
        if (xd > -16 && xd < 16) {
            if (yd > -this.Height && yd < shell.Height) {
                Resources.PlaySound("kick");

                this.Xa = shell.Facing * 2;
                this.Ya = -5;
                this.FlyDeath = true;
                if (this.SpriteTemplate !== null) {
                    this.SpriteTemplate.IsDead = true;
                }
                this.DeadTime = 100;
                this.Winged = false;
                this.YFlip = true;
                return true;
            }
        }
        return false;
    }

    FireballCollideCheck(fireball) {
        if (this.DeadTime !== 0) {
            return false;
        }

        var xd = fireball.X - this.X, yd = fireball.Y - this.Y;
        if (xd > -16 && xd < 16) {
            if (yd > -this.Height && yd < fireball.Height) {
                if (this.NoFireballDeath) {
                    return true;
                }

                Resources.PlaySound("kick");

                this.Xa = fireball.Facing * 2;
                this.Ya = -5;
                this.FlyDeath = true;
                if (this.SpriteTemplate !== null) {
                    this.SpriteTemplate.IsDead = true;
                }
                this.DeadTime = 100;
                this.Winged = false;
                this.YFlip = true;
                return true;
            }
        }
    }

    BumpCheck(xTile, yTile) {
        if (this.DeadTime !== 0) {
            return;
        }

        if (this.X + this.Width > xTile * 16 && this.X - this.Width < xTile * 16 + 16 && yTile === ((this.Y - 1) / 16) | 0) {
            Resources.PlaySound("kick");

            this.Xa = -Mario.MarioCharacter.Facing * 2;
            this.Ya = -5;
            this.FlyDeath = true;
            if (this.SpriteTemplate !== null) {
                this.SpriteTemplate.IsDead = true;
            }
            this.DeadTime = 100;
            this.Winged = false;
            this.YFlip = true;
        }
    }

    Draw(container, camera) {
        // Update main sprite via super (FrameSprite/NotchSprite logic)
        super.Draw(container, camera);

        if (this.pixiSprite) {
            // Handle Orientation (Flip)
            // Existing logic uses XFlip/YFlip
            // Scale -1 flips around anchor. Default anchor 0,0 means it flips left. 
            // We might need to adjust anchor or position.
            // NotchSprite/Enemy logic centers?
            // Original drawImage dest: this.X - camera.X.
            // If flipped, context uses (xPixel - width) etc.

            // Simplified Flip for Pixi:
            // Set anchor to 0.5?
            // If we assume default anchor 0, flipX means we need to shift x by width

            if (this.XFlip) {
                this.pixiSprite.scale.x = -1;
                this.pixiSprite.anchor.x = 1; // Pivot at right edge so it flips in place
                // Or just set anchor 0.5 and offset pos?
                // Let's stick to anchor 0 (default) but shift position + width
                // Actually anchor=1 is easiest for "flip around right edge" but we want "flip in place".
                // If X is left-top, flipping scale makes it draw leftwards from X.
                // So we need to move X += Width.

                // Actually, existing logic:
                // context.translate(this.XFlip ? -320 : 0, ...) -> This was whole screen flip logic?? 
                // No, context.scale(-1, 1).
                // If scale -1, coords are inverted.
                // Draw at (320 - xPixel - 24) ??

                // Let's generalize:
                // Pixi Simple Flip:
                // this.pixiSprite.scale.x = this.XFlip ? -1 : 1;
                // this.pixiSprite.scale.y = this.YFlip ? -1 : 1;
                // this.pixiSprite.anchor.set(0.5, 0); // Center horizontally?
                // Original X/Y is Top-Left of sprite?

                // If I use anchor 0 (Top-left):
                this.pixiSprite.anchor.set(0, 0);
                this.pixiSprite.scale.x = 1;
                this.pixiSprite.scale.y = 1;

                if (this.XFlip) {
                    this.pixiSprite.anchor.x = 1; // top-right becomes origin
                    this.pixiSprite.scale.x = -1; // grow left... wait. 
                    // If scale is -1, drawing 0 to 10 goes 0 to -10.
                    // If anchor is 1, origin is at width (10).
                    // So it draws from 10 down to 0 ? 

                    // Simple approach:
                    // scale.x = -1
                    // position.x += width
                }

                if (this.YFlip) {
                    this.pixiSprite.anchor.y = 1;
                    this.pixiSprite.scale.y = -1;
                }
            } else {
                this.pixiSprite.scale.set(1, 1);
                this.pixiSprite.anchor.set(0, 0);
            }
        }

        if (this.Winged && this.pixiSprite) {
            if (!this.wingSprite) {
                const tex = new PIXI.Texture({
                    source: this.pixiSprite.texture.source, // same source
                    frame: new PIXI.Rectangle(0, 4 * 32, 16, 32)
                });
                this.wingSprite = new PIXI.Sprite(tex);
                this.pixiSprite.addChild(this.wingSprite); // Attach to parent
            }

            // Update wing animation frame
            const wingFrameIndex = ((this.WingTime / 4) | 0) % 2;
            this.wingSprite.texture.frame.x = wingFrameIndex * 16;
            this.wingSprite.texture.frame.y = 4 * 32;
            this.wingSprite.texture.frame.width = 16;
            this.wingSprite.texture.frame.height = 32;
            this.wingSprite.texture.updateUvs();

            // Position relative to parent
            // logic from original:
            // context.drawImage(..., xPixel - 8, ...)
            // original parent draw: xPixel + something?
            // Relative position seems to be offset by -8?
            this.wingSprite.x = -8;
            this.wingSprite.y = -8; // Approximate, might need tuning based on visual check
        }
    }
}

//Static variables
Enemy.RedKoopa = 0;
Enemy.GreenKoopa = 1;
Enemy.Goomba = 2;
Enemy.Spiky = 3;
Enemy.Flower = 4;
