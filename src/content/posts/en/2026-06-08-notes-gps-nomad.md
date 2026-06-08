---
title: "Geolocation on Nomad: NotesGPS, NotesGPSPosition, and NotesGPSCoordinates"
description: "Classic LotusScript has no location API — but an app running on HCL Nomad can read the user's latitude and longitude. NotesGPS is Domino's client-side geolocation class for Nomad: start from NotesSession.CreateGPS(), authorise with RequestAccess(), fetch a NotesGPSPosition with GetCurrentPosition(), then read Latitude / Longitude off its NotesGPSCoordinates. This article walks the three-class chain, annotates the official example line by line, and covers the gotchas — error 4508, empty Speed/Heading on the first iOS call, and HighAccuracy failing indoors."
pubDate: 2026-06-08T07:30:00+08:00
lang: en
slug: notes-gps-nomad
tags:
  - "LotusScript"
  - "Tutorial"
  - "Nomad"
sources:
  - title: "NotesGPS class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESGPS_CLASS.html"
  - title: "NotesGPSPosition class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESGPSPOSITION_CLASS.html"
  - title: "NotesGPSCoordinates class — HCL Domino Designer 14.5"
    url: "https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESGPSCOORDINATES_CLASS.html"
relatedJava: []
relatedSsjs: []
cover: "/covers/notes-gps-nomad.webp"
coverStyle: "art-deco"
---

You're handed a requirement for a field-inspection app: the inspector arrives on site, taps "Check in here" on a Notes form, and the system should stamp their current latitude and longitude onto the document. The problem — you scan the whole LotusScript class list, from `NotesDatabase` to `NotesDocument`, and nothing touches "location." Classic LotusScript was written for the desktop Client, and desktops have no GPS, so there was never a location API.

But what if that app runs on **HCL Nomad**? The phone has a GPS chip, and Domino does provide a small set of client-side location classes for exactly this case. The entry point is a single line: `Set gps = session.CreateGPS()`.

This article unpacks [`NotesGPS`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESGPS_CLASS.html) and its two companions, `NotesGPSPosition` and `NotesGPSCoordinates` — from authorisation, to fetching a position, to reading the coordinates, plus the gotchas the docs tuck into the corners that bite if you skip them.

---

## TL;DR

- **Three classes, one chain**: [`NotesGPS`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESGPS_CLASS.html) (the entry point) → `NotesGPSPosition` (the result of one fix) → `NotesGPSCoordinates` (the actual numbers)
- Create `NotesGPS` with `session.CreateGPS()` — **it hangs off `NotesSession`**, you don't `New` it
- Always call [`RequestAccess()`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REQUESTACCESS_METHOD_NGPS.html) **before** asking for coordinates — it raises the OS permission prompt and returns a `Boolean`
- `GetCurrentPosition()` returns a `NotesGPSPosition`; read its `Coordinates` property to get a `NotesGPSCoordinates`
- The coordinate properties are all **read-only `Variant` (Double)**: `Latitude`, `Longitude`, `Altitude`, `Accuracy`, `AltitudeAccuracy`, `Heading`, `Speed`
- **Platform floor**: HCL Nomad on iOS / Android needs **V1.0.4+**, Nomad for web browsers needs **V1.0.3+**
- Three gotchas: a denied prompt throws **error 4508**; `Speed` / `Heading` may be empty on the first iOS call; don't use `HighAccuracy` indoors

---

## Three classes, one chain

This API is layered on purpose — don't treat it as one big object:

| Class | Role | How you get it |
|---|---|---|
| `NotesGPS` | The entry point: handles authorisation and issues the request | `session.CreateGPS()` |
| `NotesGPSPosition` | The container for "one fix", carrying a timestamp | `gps.GetCurrentPosition()` |
| `NotesGPSCoordinates` | The actual latitude/longitude and friends | `position.Coordinates` |

The official one-liners are terse: `NotesGPS` "Provides access to user location for supported platforms"; [`NotesGPSPosition`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESGPSPOSITION_CLASS.html) "Represents a position provided by the global positioning device on a platform"; [`NotesGPSCoordinates`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_NOTESGPSCOORDINATES_CLASS.html) "Contains the current coordinates of the position of a device".

Think of it as unwrapping a parcel: `NotesGPS` is the counter where you ask the platform for a location; what comes back is a `NotesGPSPosition` parcel (with a "when was this measured" label attached); open the parcel and `NotesGPSCoordinates` is the string of numbers inside.

## Step 1: Get NotesGPS from NotesSession

`NotesGPS` isn't created with `New` — it's vended by `NotesSession`, the same factory-method pattern as all the `CreateXxx` calls covered in the earlier [`NotesSession`](/domino-news/posts/notes-session/) piece:

```lotusscript
Dim session As New NotesSession
Dim gps As NotesGPS
Set gps = session.CreateGPS()
```

Once you have `gps`, it carries just two properties — but both are worth knowing:

| Property | Access | Role (verbatim) |
|---|---|---|
| `TimeoutSec` | Read/Write | "Timeout in seconds for a NotesGPS request." |
| `HighAccuracy` | Read/Write | "Tells the platform to return only a high-accuracy location. **Not for use when indoors.**" |

That "not for use when indoors" is the documentation's own warning, not mine. The reason is practical: high-accuracy mode forces the device to wait for a precise satellite fix. Indoors, where satellite signal is weak, it won't quietly fall back to coarse Wi-Fi / cell positioning — it's far more likely to simply time out.

### RequestAccess: get permission before you ask for a position

Location is a sensitive permission; the OS won't let your app silently read the user's position. So before fetching any coordinate, you must call [`RequestAccess()`](https://help.hcl-software.com/dom_designer/14.5.1/basic/H_REQUESTACCESS_METHOD_NGPS.html):

```lotusscript
Dim hasAccess As Boolean
hasAccess = gps.RequestAccess()
If Not hasAccess Then
    ' Denied, or platform unsupported — don't proceed to read coordinates
    Exit Sub
End If
```

It does exactly what it says — "Requests access from the platform". The return is a `Boolean`: `True` if access is granted, `False` if not. On the first call the user sees the OS location-permission prompt; after that it follows whatever they chose.

**You can't skip this step.** Calling `GetCurrentPosition()` without `RequestAccess()` on an unauthorised device runs straight into error 4508 (more below).

## Step 2: GetCurrentPosition fetches the fix

With access granted, fetch the position:

```lotusscript
Dim pos As NotesGPSPosition
Set pos = gps.GetCurrentPosition()
```

`GetCurrentPosition()` "Sends a request to the platform to get the current position" and returns a `NotesGPSPosition`. That object has two read-only properties and one method:

| Member | Type | Role |
|---|---|---|
| `Coordinates` | `NotesGPSCoordinates` (read) | The latitude/longitude and friends for this fix |
| `TimeStamp` | `NotesDateTime` (read) | When this position was measured |
| `Update()` | method | "Requests the platform to update the current NotesGPSPosition" — re-measure into the same object |

`TimeStamp` returns the familiar [`NotesDateTime`](/domino-news/posts/notes-datetime/), so you can compare it against other time fields on the document or compute an age. Its purpose is to judge whether a fix is still fresh enough — if you've been holding a `NotesGPSPosition` for a while, rather than re-running the whole chain you can call `pos.Update()` to refresh the same object in place.

## Step 3: Read the coordinates

At the innermost layer, `NotesGPSCoordinates` is just a bag of numbers. It has **no methods** — only read-only properties, all of type `Variant` (containing a `Double`):

| Property | Holds ("…of the current position if available") |
|---|---|
| `Latitude` | Latitude |
| `Longitude` | Longitude |
| `Altitude` | Altitude |
| `Accuracy` | Accuracy of the horizontal position |
| `AltitudeAccuracy` | Accuracy of the altitude |
| `Heading` | Direction of travel |
| `Speed` | Speed of travel |

Notice every official description ends with **"if available"** — that's not the docs hedging, it's literally "not guaranteed to have a value". A stationary phone has no meaningful `Speed` or `Heading`; `Altitude` may be missing on some devices or browser-based fixes. In practice, treat everything except `Latitude` / `Longitude` as possibly empty.

## The official example, line by line

Chained together, the three steps are the `getCoordinates()` function from the official docs. Here it is verbatim, then annotated:

```lotusscript
Public Function getCoordinates() As String

    On Error GoTo errhandler
    On Error 4508 GoTo err4508

    Dim session As New NotesSession
    Dim gps As NotesGPS
    Set gps = session.CreateGPS()

    Dim hasAccess As Boolean
    hasAccess = GPS.Requestaccess()
    If hasAccess Then
        Dim pos As NOTESGPSPOSITION
        Set pos = GPS.Getcurrentposition()
        Dim coo As NOTESGPSCOORDINATES
        Set coo = pos.Coordinates
        Dim lat As Double
        Dim lot As Double
        lat = coo.Latitude
        lot = coo.Longitude
    End If
    getCoordinates = "Coordinates: LAT " & lat & " LONG " & lot
    Exit Function
errhandler:
    MsgBox Error$ & " in " & Erl & " - " & Err
    Exit Function
err4508:
    getCoordinates = ""
    Exit Function
End Function
```

Things worth noting:

- **Two `On Error` lines**: `On Error 4508 GoTo err4508` traps the authorisation/location-failure class specifically, separate from generic errors. This is the canonical shape for this API.
- **`If hasAccess Then` gates everything**: with no access the block is skipped, and the returned `lat` / `lot` stay `0`. If your logic must distinguish "genuinely at 0,0 off the coast of Africa" from "never got a fix", track that with the `hasAccess` flag yourself — don't infer it from the coordinates.
- **`err4508` returns an empty string**: the official example maps "location failed" to `""`, leaving the caller to decide how to handle an empty result.

For that field-inspection app, just write `lat` / `lot` onto the document:

```lotusscript
Call doc.ReplaceItemValue("Lat", coo.Latitude)
Call doc.ReplaceItemValue("Long", coo.Longitude)
Call doc.ReplaceItemValue("FixTime", pos.TimeStamp.LSLocalTime)
```

## Gotchas worth knowing

**1. Error 4508 = no access / location unavailable.** This is the most common runtime error for this API. A user tapping "Don't Allow" on the prompt, the device having location services off, or the platform simply not supporting it all land here. Always catch it with `On Error 4508` — never let it surface as a raw LotusScript error box in the user's face.

**2. On iOS, the first call may leave `Speed` and `Heading` empty.** Verbatim: "For iOS, the values for Speed and Heading are filled in the GPS location data once the device has gathered enough course data. These values may not be available on the first call of GPS.getCurrentPosition." In plain terms — iOS needs the device to "move a bit" and accumulate course data before it can fill in speed and direction. If your feature depends on `Speed` / `Heading`, an empty first read is normal; call again later, or `Update()` to re-measure.

**3. `HighAccuracy` will time you out indoors.** As noted above, this property demands a precise fix; indoors, with no satellite signal, it tends to hang until the `TimeoutSec` you set and then fail. For indoor scenarios — or anywhere "roughly which building" is precise enough — leave `HighAccuracy` off.

**4. The platform version is a hard floor.** These classes only exist on a new-enough Nomad: **V1.0.4+** on iOS / Android, **V1.0.3+** for web browsers. Run the same code on the desktop Notes Client and the object `CreateGPS()` returns has no usable location source — this is a Nomad-only feature, so design the form with a desktop fallback in mind.

## What about Java and SSJS?

The cross-language verdict here is clean: **there is no counterpart.**

| Language | Counterpart | Why |
|---|---|---|
| Java (`lotus.domino.*`) | None | The back-end Java API runs server-side, and a server has no notion of "the user's location" |
| SSJS / XPages | None | Same reason — location is a device-side capability, outside the reach of server-side JavaScript |

That absence actually says what `NotesGPS` really is: not a "data-processing" class, but a **bridge to a device capability**. It only makes sense in an environment like Nomad, where LotusScript runs on a mobile device that has a GPS. To do geolocation on the XPages / web side you'd reach for the browser's native Geolocation API — a completely different path, unrelated to any Domino class.

In other words, this is one of the rare corners where LotusScript on Nomad is *more* direct than Java or SSJS — because it wires straight into the device hardware.
