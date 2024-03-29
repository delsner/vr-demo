import { Component, OnInit, ElementRef } from '@angular/core';
import { VgAPI } from 'videogular2/core';
import { TimerObservable } from "rxjs/observable/TimerObservable";


interface IAframeEntity {
    id: string;
    position: string;
    rotation: string;
}
interface IVrDoor extends IAframeEntity {
    goto: string;
}
interface IVrText extends IAframeEntity {
    text: string;
    scale: string;
    opaAnim: string;
    posAnim: string;
}
interface IVrTextPlane extends IAframeEntity {
    position: string;
    rotation: string;
    target: string;
    width: number;
    height: number;
    isShown: boolean;
}
interface IVideo {
    id: string;
    url: string;
    track: string;
    doors: Array<IVrDoor>;
    texts: Array<IVrText>;
    textPlanes: Array<IVrTextPlane>;
}

@Component({
    selector: 'vr-player',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss']
})
export class VRPlayer implements OnInit {
    elem: any;
    aframe: any;
    cuePointData: any = {};
    hideTitle: boolean = true;
    currentVideo: IVideo;
    timeout: any;
    vgApi:VgAPI;
    videos: Array<IVideo> = [
        {
            id: 'v0',
            url: 'https://ancient-earth-85004.herokuapp.com/kitchen.m4v',
            track: 'https://ancient-earth-85004.herokuapp.com/kitchen.vtt',
            doors: [
                {id: 'd1', position: '-3 2 -10', rotation: '0 0 0', goto: 'v1'}
            ],
            texts: [],
            textPlanes: []
        },
        {
            id: 'v1',
            url: 'https://ancient-earth-85004.herokuapp.com/room.m4v',
            track: 'https://ancient-earth-85004.herokuapp.com/room.vtt',
            doors: [
                {id: 'd2', position: '8 1 0', rotation: '0 -130 0', goto: 'v0' }
            ],
            texts: [
                {
                    id: 't1',
                    text: 'Hier kann ein Text hin',
                    position: '6 0 -4',
                    rotation: '0 -30 0',
                    scale: '2 2 2',
                    opaAnim: 'startEvents: t1; property: opacity; dur: 300; from: 0; to: 1; elasticity: 1000',
                    posAnim: 'startEvents: t1; property: position; dur: 500; from: 6 0 -4; to: 6 0.3 -4; elasticity: 1000'
                }
            ],
            textPlanes: [
                {id: 'p1', position: '17 0 -7', rotation: '-90 -30 0', width: 20, height: 20, target: 't1', isShown: false}
            ]
        }
    ];

    constructor(ref: ElementRef) {
        this.elem = ref.nativeElement;
        this.currentVideo = this.videos[0];
    }

    ngOnInit() {
        this.aframe = this.elem.querySelector('a-scene');
    }

    onAframeRenderStart() {
        const media = this.vgApi.getDefaultMedia();
        if(media.isMetadataLoaded) {
            this.displayDoors();
        }
    }

    onPlayerReady(api:VgAPI) {
        this.vgApi = api;
        const media = api.getDefaultMedia();
        if(media.isMetadataLoaded) {
            this.displayDoors();
        }
        media.subscriptions.loadedMetadata.subscribe(this.displayDoors.bind(this));
    }

    displayDoors() {
        Array.from(document.querySelectorAll('a-image'))
            .forEach(item => item.dispatchEvent(new CustomEvent('vgStartFadeInAnimation')));
    }

    onMouseEnterPlane(plane:IVrTextPlane) {
        if (!plane.isShown) {
            let target = document.querySelector('#' + plane.target);
            target.dispatchEvent(new CustomEvent(plane.target));
            plane.isShown = true;
        }
    }

    onMouseEnter($event:any, door:IVrDoor) {
        $event.target.dispatchEvent(new CustomEvent('vgStartAnimation'));

        this.timeout = TimerObservable.create(2000).subscribe(
            () => {
                this.currentVideo = this.videos.filter(v => v.id === door.goto)[0];
            }
        );
    }

    onMouseLeave($event:any) {
        $event.target.dispatchEvent(new CustomEvent('vgPauseAnimation'));

        // Send start and pause again to reset the scale and opacity
        $event.target.dispatchEvent(new CustomEvent('vgStartAnimation'));
        $event.target.dispatchEvent(new CustomEvent('vgPauseAnimation'));

        this.timeout.unsubscribe();
    }

    onEnterCuePoint($event:any) {
        this.hideTitle = false;
        this.cuePointData = JSON.parse($event.text);
    }

    onExitCuePoint($event:any) {
        this.hideTitle = true;

        // wait transition
        TimerObservable.create(500).subscribe(
            () => { this.cuePointData = {}; }
        );
    }

    ngOnDestroy() {
        this.timeout.unsubscribe();
    }
}
