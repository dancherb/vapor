![](https://i.imgur.com/cb9xWau.png)

# Vapor - A Steem App

Vapor is a React Native app that integrates with the Steem blockchain, as well as a custom Node/Express/MongoDB back-end to add on functionality like messaging and notifications.

When you enter your private key, it is verified via Steem on the client-side and kept in your phone's local storage to use when interacting with the Steem network. It is also verified on the server-side in order to give you access to your messages and notifications. We don't hang onto your keys or keep them anywhere in the database. At one point, the last 8 digits of your key were kept encrypted on the database and used to help verify you - this is no longer the case (we found we didn't need this extra step) and this data has been cleared.

We attach ourselves as 1% beneficiaries to posts made through the app.

This repo is intended to demonstrate how we handle your data - if you have any questions about the code or are interested in collaborating, send an email to vapor@cherb.co.uk.

Available now on the app stores:

iOS: https://itunes.apple.com/gb/app/vapor-a-steem-app/id1359525246
Android: https://play.google.com/store/apps/details?id=com.vapor