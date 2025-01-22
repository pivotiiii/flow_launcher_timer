# Timer Plugin for Flow Launcher

This is a plugin for [Flow Launcher](https://www.flowlauncher.com) that uses [hourglass](https://github.com/i2van/hourglass) to set timers.

![timer1](https://github.com/pivotiiii/flow_launcher_timer/assets/17112987/695834f1-2eae-4614-92bc-b257314f1ef1)

## Installation

This plugin can be installed using the Flow Launcher Plugin Store or directly from the Flow Launcher search bar by entering

`pm install Timer`

## Usage

The default keyword is `timer`. Times can be entered in many different ways, including but not limited to:

| Input              | Result                                                                 |
| ------------------ | ---------------------------------------------------------------------- |
| 5                  | count down for 5 minutes                                               |
| 5:30 pizza         | count down for 5 minutes 30 seconds and set the timer title to 'pizza' |
| 7:30:00            | count down for 7 hours 30 minutes                                      |
| 5min               | count down for 5 minutes                                               |
| 7 hours 30 minutes | count down for 7 hours 30 minutes                                      |
| 01/01/25 \*        | count down until January 1, 2025                                       |
| 01/01/2025 \*      | count down until January 1, 2025                                       |
| January 1, 2025 \* | count down until January 1, 2025                                       |
| Jan1 birthday      | count down until January 1 and set the timer title to 'birthday'       |
| 2 pm               | count down until 2 pm                                                  |
| until 5            | count down until 5 am/pm (12hr) or 5 am (24hr)                         |
| noon               | count down until noon                                                  |
| midnight           | count down until midnight                                              |
| Friday             | count down until midnight Friday                                       |

\* The order of the day, month, and year depends on your system settings.

All time values are case insensitive. Timer titles are optional and cannot contain any spaces.

![timer2](https://github.com/pivotiiii/flow_launcher_timer/assets/17112987/2e5a1d16-0f5a-4fab-9f39-c4c8cbe52668)

Timers can be paused/resumed with `pause` and `resume`.

Any invalid inputs also show an option that displays a help site.
