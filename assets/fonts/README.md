# Why these are here

Satori — the renderer behind `ImageResponse`, which draws the Open Graph card
and the story image — cannot read woff2. The self-hosted Manrope in
`node_modules/@fontsource-variable/manrope` ships woff2 only, and it is a
variable font, which satori also handles badly.

These two files are static instances cut from that same variable font at
weight 400 and weight 700, converted to TTF. Same typeface, same source, no new
dependency and no font network involved.

To regenerate after a Fontsource upgrade:

    python3 -c "
    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer
    src='node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2'
    for w,n in ((400,'regular'),(700,'bold')):
        f=instancer.instantiateVariableFont(TTFont(src), {'wght': w}, updateFontNames=True)
        f.flavor=None
        f.save('assets/fonts/manrope-'+n+'.ttf')
    "
