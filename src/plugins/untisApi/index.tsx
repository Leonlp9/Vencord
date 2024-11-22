/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { addServerListElement, removeServerListElement, ServerListRenderPosition } from "@api/ServerList";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { ModalProps, ModalRoot, openModal } from "@utils/modal";
import definePlugin, { OptionType } from "@utils/types";
import { Button, React } from "@webpack/common";

import WebUntisAPI from "./api/untisApi";



interface ActivityAssets {
    large_image?: string;
    large_text?: string;
    small_image?: string;
    small_text?: string;
}

interface Activity {
    state?: string;
    details?: string;
    timestamps?: {
        start?: number;
        end?: number;
    };
    assets?: ActivityAssets;
    buttons?: Array<string>;
    name: string;
    application_id: string;
    metadata?: {
        button_urls?: Array<string>;
    };
    type: ActivityType;
    url?: string;
    flags: number;
}

const enum ActivityType {
    PLAYING = 0,
    STREAMING = 1,
    LISTENING = 2,
    WATCHING = 3,
    COMPETING = 5
}

const enum TimestampMode {
    NONE,
    NOW,
    TIME,
    CUSTOM,
}



const settings = definePluginSettings({
    Key: {
        type: OptionType.STRING,
        name: "Key",
        description: "Your user key (required)",
        defaultValue: "XXXXXXXXXXXXXXXX"
    },
    School: {
        type: OptionType.STRING,
        name: "School",
        description: "Your school name (required)",
        defaultValue: "your-school"
    },
    UntisUsername: {

        type: OptionType.STRING,
        name: "Username for untis",
        description: "Its your untis username",
        defaultValue: "your-username"
    },
    Untisver: {
        type: OptionType.STRING,
        name: "Untis Version",
        description: "Your untis version",
        defaultValue: "arche",
    },
    UntisType: {
        type: OptionType.SELECT,
        description: "What time table do you want to use",
        options: [
            {
                label: "Student",
                value: "STUDENT",
                default: true
            },
            {
                label: "Class",
                value: "CLASS"
            },
            {
                label: "Room",
                value: "ROOM"
            }
        ]
    },
    AppID: {
        type: OptionType.STRING,
        name: "App ID",
        description: "Your Discord Bot application ID (required for Discord RPC)",
        defaultValue: ""
    },
    EnableDiscordRPC: {
        type: OptionType.BOOLEAN,
        name: "Enable Discord RPC",
        description: "Show your current lesson for others on Discord in the Rich Presence",
        defaultValue: true,
        onChange: onChange
    },
    type: {
        type: OptionType.SELECT,
        description: "Activity type",
        onChange: onChange,
        options: [
            {
                label: "Playing",
                value: ActivityType.PLAYING,
                default: true
            },
            {
                label: "Streaming",
                value: ActivityType.STREAMING
            },
            {
                label: "Listening",
                value: ActivityType.LISTENING
            },
            {
                label: "Watching",
                value: ActivityType.WATCHING
            },
            {
                label: "Competing",
                value: ActivityType.COMPETING
            }
        ]
    },
    Name: {
        type: OptionType.STRING,
        name: "Name",
        defaultValue: "{lesson} with {teacher}",
        description: "The name of the activity"
    },
    Description: {
        type: OptionType.STRING,
        name: "Description",
        defaultValue: "In room {room}",
        description: "The description of the activity"
    }
});



function onChange() {
}


const handleButtonClick = async () => {

    openModal(props => <UntisModalContent rootProps={props} />);

    /* try {
        // Authenticate the WebUntisAPI instance
        console.log("Fetching timetable...");
        const currentlessen = await webUntis.getCurrentLesson(1);
        if (!currentlessen) {
            console.log("No lesson found");
        } else {
            FluxDispatcher.dispatch({
                type: "LOCAL_ACTIVITY_UPDATE",
                activity: {
                    application_id: "",
                    flags: 1,
                    name: "Untericht",
                    details: "Grad in einer stunde",
                    type: 0,
                },
                socketId: "CustomRPC",
            });
            // set rpc
        }
    } catch (error) {
        console.error("Error fetching timetable:", error);
    } */
};

const UntisButton = () => (
    <Button
        onClick={handleButtonClick}
        size={Button.Sizes.MIN}
        color={Button.Colors.CUSTOM}
        className="vc-untis-button"
    >
        <div className="vc-untis-button-content">
            <svg className="untis-button" viewBox="0 0 24 24" fill="currentColor">
                <path fill="currentColor" className="st0" d="M12,0C5.37,0,0,5.37,0,12s5.37,12,12,12,12-5.37,12-12S18.63,0,12,0ZM1.53,12.33v-.67h3.89v.67H1.53ZM4.83,19.64l-.47-.47,2.75-2.75.47.47-2.75,2.75ZM7.11,7.58l-2.75-2.75.47-.47,2.75,2.75-.47.47ZM12.33,22.47h-.67v-3.89h.67v3.89ZM19.17,19.64l-2.75-2.75.47-.47,2.75,2.75-.47.47ZM11,12V2.53c.39-.39.61-.61,1-1,.39.39.61.61,1,1v6.05l4.8-4.8h1.42v1.42l-4.8,4.8h7.05c.39.39.61.61,1,1-.39.39-.61.61-1,1h-10.47Z" />
            </svg>
        </div>
    </Button>
);

const UntisModalContent = ({ rootProps }: { rootProps: ModalProps; }) => {
    const [timetable, setTimetable] = React.useState<any[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [timeGrid, setTimeGrid] = React.useState<any>(null);
    const untis = new WebUntisAPI(
        settings.store.School || "defaultSchool",
        settings.store.UntisUsername || "defaultUsername",
        settings.store.Key || "defaultKey",
        settings.store.Untisver || "arche",
        settings.store.UntisType || "STUDENT"
    );

    const [currentWeek, setCurrentWeek] = React.useState<number>(untis.getCurrentCalendarWeek());

    React.useEffect(() => {
        const fetchTimetable = async () => {
            try {
                const untis = new WebUntisAPI(
                    settings.store.School || "defaultSchool",
                    settings.store.UntisUsername || "defaultUsername",
                    settings.store.Key || "defaultKey",
                    settings.store.Untisver || "arche",
                    settings.store.UntisType || "STUDENT"
                );
                await untis.setUp();

                const timegrid = untis.getFullUntisIdData().masterData.timeGrid;

                // Zeitformat anpassen
                timegrid.days.forEach((day: any) => {
                    day.units.forEach((unit: any) => {
                        unit.start = unit.startTime.slice(1); // Entfernt "T"
                        unit.end = unit.endTime.slice(1);
                    });
                });

                timegrid.days = timegrid.days.filter((day: any) => {
                    const isSaturday = day.day === "SAT";
                    const hasClasses = getPeriodsAtWeekday(6).length > 0;
                    return !isSaturday || hasClasses;
                });

                setTimeGrid(timegrid);

                const timetableData = await untis.getTimetable({
                    id: 1,
                    type: settings.store.UntisType as "STUDENT" | "CLASS" | "ROOM",
                    startDate: untis.getMondayOfCalendarWeek(currentWeek, new Date().getFullYear()),
                    endDate: untis.getFridayOfCalendarWeek(currentWeek, new Date().getFullYear())
                });

                setTimetable(timetableData.periods);
            } catch (error) {
                if (error instanceof Error) {
                    setError(error.message);
                    console.error(error);
                } else {
                    setError(String(error));
                }
            }
        };

        fetchTimetable();
    }, [currentWeek]);

    const handlePreviousWeek = () => {
        setTimetable([]);
        setCurrentWeek(currentWeek - 1);
    };

    const handleNextWeek = () => {
        setTimetable([]);
        setCurrentWeek(currentWeek + 1);
    };

    if (error) {
        return (<ModalRoot {...rootProps}>
            <div className="vc-untis-error">
                <div>{error}</div>
            </div>
        </ModalRoot>);
    }

    if (!timeGrid || !timetable) {
        return (<ModalRoot {...rootProps}>
            <div className="vc-untis-loading">
                <div>Loading...</div>
            </div>
        </ModalRoot>);
    }

    for (let i = 0; i < timeGrid.days.length; i++) {
        const day = timeGrid.days[i];
        const { units } = day;
        for (let j = 0; j < units.length - 1; j++) {
            const unit = units[j];
            const nextUnit = units[j + 1];
            if (unit.end === nextUnit.start) {
                const periodsAtCurrentTime = getPeriodsAtWeekdayAndTime(i + 1, unit.start);
                const periodsAtNextTime = getPeriodsAtWeekdayAndTime(i + 1, nextUnit.start);

                const sameSubjectAndRoom = periodsAtCurrentTime.every((period: any) =>
                    periodsAtNextTime.some((nextPeriod: any) =>
                        period.subjects[0].id === nextPeriod.subjects[0].id &&
                        period.rooms[0].id === nextPeriod.rooms[0].id &&
                        period.teachers[0].id === nextPeriod.teachers[0].id &&
                        period.classes[0].id === nextPeriod.classes[0].id
                    )
                );

                if (sameSubjectAndRoom) {
                    unit.end = nextUnit.end;
                    units.splice(j + 1, 1);
                    j--;
                }
            }
        }
    }

    // Zeitfenster aus `timeGrid` extrahieren
    const timeSlots = Array.from(
        new Set(
            timeGrid.days.flatMap((day: any) => day.units.map((unit: any) => unit.start))
        )
    ).sort();

    function getPeriodsAtWeekday(weekday: number) {
        return timetable.filter((period: any) => {
            const startDateTime = new Date(period.startDateTime);
            return startDateTime.getDay() === weekday;
        });
    }

    function getPeriodsAtWeekdayAndTime(weekday: number, time: string) {
        // startDateTime: "2024-11-20T07:30Z"
        return timetable.filter((period: any) => {
            const startDateTime = new Date(period.startDateTime);
            const isRightWeekday = startDateTime.getDay() === weekday;
            const isBetweenStartAndEnd = period.startDateTime.split("T")[1].slice(0, 5) <= time && time < period.endDateTime.split("T")[1].slice(0, 5);
            return isRightWeekday && isBetweenStartAndEnd;
        });
    }

    return (
        <ModalRoot className="vc-untis" {...rootProps}>
            <div className="vc-untis-modal">
                <div className="vc-untis-modal-content">

                    {/* change weeks */}
                    <div className="vc-untis-week">
                        <div className="vc-untis-week-button" onClick={handlePreviousWeek}>{"←"}</div>
                        <div className="vc-untis-week-text">KW {currentWeek} ({untis.getMondayOfCalendarWeek(currentWeek, new Date().getFullYear())} - {untis.getFridayOfCalendarWeek(currentWeek, new Date().getFullYear())})</div>
                        <div className="vc-untis-week-button" onClick={handleNextWeek}>{"→"}</div>
                    </div>

                    <table className="vc-untis-timetable">
                        <thead>
                            <tr>
                                <th>Time</th>
                                {timeGrid.days.map((day: any) => (
                                    <th key={day.day}>{day.day}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(timeSlots as string[]).map((timeSlot: string) => (
                                <tr key={timeSlot as React.Key}>
                                    <td>
                                        <div>{`${String(timeSlot)} - ${timeGrid.days[0].units.find((unit: any) => unit.start === timeSlot)?.end || ""}`}</div>
                                    </td>
                                    {timeGrid.days.map((day: any, index: number) => (
                                        <td key={index + 1}>
                                            <div className="vc-untis-periods">
                                                {getPeriodsAtWeekdayAndTime(index + 1, timeSlot).map((period: any) => (
                                                    <div key={period.id} style={{ color: period.subjects[0].backColor }} className={`vc-untis-period ${period.is[0]} ${period.homeWorks.filter((homework: any) => homework.endDate === period.startDateTime.split("T")[0]).length > 0 ? "HOMEWORK" : ""}`} onClick={() => openSingleLessonModal(period)}>
                                                        <div>
                                                            {period.subjects.map((subject: any) => (
                                                                <div key={subject.id} title={subject.longName}>{subject.name}</div>
                                                            ))}
                                                        </div>
                                                        <div>
                                                            {period.teachers.map((teacher: any) => (
                                                                <div key={teacher.id} title={teacher.longName}>{teacher.name}</div>
                                                            ))}
                                                        </div>
                                                        <div>
                                                            {period.rooms.map((room: any) => (
                                                                <div key={room.id} title={room.longName}>{room.name}</div>
                                                            ))}
                                                        </div>
                                                        <div>
                                                            {period.classes.map((class_: any) => (
                                                                <div key={class_.id} title={class_.longName}>{class_.name}</div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </ModalRoot>
    );
};


const SingleLessonModalContent = ({ rootProps, period }: { rootProps: ModalProps; period: any; }) => {
    return (
        <ModalRoot {...rootProps}>
            <div className="vc-untis-single-lesson">
                <h2>{period.subjects[0].name} ({period.subjects[0].longName})</h2>
                <p>Teacher: {period.teachers[0].name} ({period.teachers[0].longName})</p>
                <p>Room: {period.rooms[0].name} ({period.rooms[0].longName})</p>
                <p>Class: {period.classes[0].name} ({period.classes[0].longName})</p>

                {period.homeWorks
                    .filter((homework: any) => homework.endDate === period.startDateTime.split("T")[0])
                    .length > 0 && (
                        <div className="vc-untis-single-lesson-homework">
                            <h3>Homeworks</h3>
                            {period.homeWorks
                                .filter((homework: any) => homework.endDate === period.startDateTime.split("T")[0])
                                .map((homework: any) => (
                                    <div key={homework.id}>
                                        <p>{homework.text}</p>
                                    </div>
                                ))}
                        </div>
                    )}
            </div>
        </ModalRoot>
    );
};

function openSingleLessonModal(period: any) {
    openModal(props => <SingleLessonModalContent rootProps={props} period={period} />);
}


export default definePlugin({
    name: "UntisAPI",
    description: "Show your current lesson in Discord",
    authors: [Devs.Leonlp9, Devs.minikomo],
    settings,
    dependencies: ["ServerListAPI"],

    renderUntisButton: UntisButton,

    start() {
        addServerListElement(ServerListRenderPosition.Above, this.renderUntisButton);
    },

    stop() {
        removeServerListElement(ServerListRenderPosition.Above, this.renderUntisButton);
    }
});
