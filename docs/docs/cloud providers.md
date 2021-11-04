---
sidebar_position: 7
---

# Cloud providers

### Prepare credentials

##### Apple

For apple you want to go to [this page](https://support.apple.com/en-us/HT204397) and after following the guide, you will have Apple ID and app-specific password.

##### Google

For google you want to go to Google Cloud Platform/Credentials page, then create a credential that suite your use case. You want `clientId` ,`client secret` and after this. Also you need to enable Google CALDAV/CARDDAV for your project.

Also you need to setup oauth screen, use proper oauth2 grant flow and you might need to get your application verified by google in order to be able to use CALDAV/CARDDAV api. Refer to [this page](https://developers.google.com/identity/protocols/oauth2) for more details.

After the oauth2 offline grant you should be able to obtain oauth2 refresh token.

:::info
Other cloud providers are not currently tested, in theory any cloud with basic auth and oauth2 should work, stay tuned for updates.
:::



### Caveats

Google caldav and carddav api are not very standard, it includes several quirks:

1. Caldav will always use UID inside `ics` file as filename, for example if you created a new event with name `1.ics` but have `abc` as its UID inside, you can only access it using `abc.ics`.
2. Time range filter does not work with google caldav.
3. Carddav will always generate a new UID for your `.vcf` files. For example a file created with name `1.vcf` with UID `abc`, it will have a UID like `1bcde2e` inside the actual created data.
4. Google api will add custom data entries inside your `ics` and `vcf` files like new `PRODID`, new `TIMETAMP` and some custom `X-` fields.
5. For carddav, you cannot create a `vcf` file with the same name again even if it's already deleted.
