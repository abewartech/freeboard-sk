/** Resource Dialog Components **
 ********************************/

import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  MatBottomSheetRef,
  MAT_BOTTOM_SHEET_DATA
} from '@angular/material/bottom-sheet';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Convert } from 'src/app/lib/convert';
import { Position } from 'src/app/lib/geoutils';
import { AppInfo } from 'src/app/app.info';
import { SignalKClient } from 'signalk-client-angular';
import {
  SKVessel,
  SKAtoN,
  SKAircraft,
  SKChart,
  SKTrack,
  SKWaypoint,
  SKRoute
} from './resource-classes';
import { SKResourceSet } from './sets/resource-set';

/********* ResourceDialog **********
	data: {
        title: "<string>" title text,
        name: "<string>"resource name,
        comment: "<string>"resource comment,
    }
***********************************/
@Component({
  selector: 'ap-resourcedialog',
  template: `
    <div class="_ap-resource">
      <div>
        <h1 mat-dialog-title>{{ data['title'] }}</h1>
      </div>
      <mat-dialog-content>
        <div style="display:flex;">
          <div class="ap-confirm-icon">
            <mat-icon color="primary">{{ icon }}</mat-icon>
          </div>
          <div>
            <div style="padding-left: 10px;">
              <div>
                <mat-form-field>
                  <input
                    matInput
                    #inpname="ngModel"
                    type="text"
                    required
                    placeholder="Resource Name"
                    [disabled]="false"
                    [(ngModel)]="data['name']"
                  />
                  <mat-error
                    *ngIf="
                      inpname.invalid && (inpname.dirty || inpname.touched)
                    "
                  >
                    Please enter a waypoint name
                  </mat-error>
                </mat-form-field>
              </div>
              <div>
                <mat-form-field>
                  <textarea
                    matInput
                    rows="2"
                    #inpcmt="ngModel"
                    placeholder="Resource Description"
                    [(ngModel)]="data['comment']"
                  >
                  </textarea>
                </mat-form-field>
              </div>
              <div *ngIf="data['type'] === 'waypoint'">
                <mat-form-field style="width:100%;" hintLabel="Signal K Type">
                  <mat-select #resourcetype [(value)]="data['skType']">
                    <mat-option
                      *ngFor="let i of resourceTypeList"
                      [value]="i.type"
                    >
                      <mat-icon><img [src]="i.icon" /></mat-icon> {{ i.name }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div *ngIf="data['position'][0]" style="font-size: 10pt;">
                <div style="display:flex;">
                  <div style="width:45px;font-weight:bold;">Lat:</div>
                  <div
                    style="flex: 1 1 auto;"
                    [innerText]="
                      data['position'][1]
                        | coords: app.config.selections.positionFormat:true
                    "
                  ></div>
                </div>
                <div style="display:flex;">
                  <div style="width:45px;font-weight:bold;">Lon:</div>
                  <div
                    style="flex: 1 1 auto;"
                    [innerText]="
                      data['position'][0]
                        | coords: app.config.selections.positionFormat
                    "
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions>
        <div style="text-align:center;width:100%;">
          <button
            mat-raised-button
            color="primary"
            [disabled]="inpname.invalid"
            (click)="dialogRef.close({ result: true, data: data })"
          >
            SAVE
          </button>
          <button
            mat-raised-button
            (click)="dialogRef.close({ result: false, data: data })"
          >
            CANCEL
          </button>
        </div>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      ._ap-resource {
        font-family: arial;
        min-width: 300px;
      }
      .ap-confirm-icon {
        min-width: 35px;
        max-width: 35px;
        color: darkorange;
        text-align: left;
      }

      @media only screen and (min-device-width: 768px) and (max-device-width: 1024px),
        only screen and (min-width: 800px) {
        .ap-confirm-icon {
          min-width: 25%;
          max-width: 25%;
        }
      }
    `
  ]
})
export class ResourceDialog implements OnInit {
  public icon: string;

  public resourceTypeList = [
    { type: '', name: 'Waypoint', icon: './assets/img/marker-gold.png' },
    {
      type: 'pseudoAtoN',
      name: 'Pseudo AtoN',
      icon: './assets/img/marker-red.png'
    }
  ];

  constructor(
    public app: AppInfo,
    public dialogRef: MatDialogRef<ResourceDialog>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      title: string;
      name: string;
      comment: string;
    }
  ) {}

  //** lifecycle: events **
  ngOnInit() {
    this.data['name'] = this.data['name'] || '';
    this.data['comment'] = this.data['comment'] || '';
    this.data['title'] = this.data['title'] || '';
    this.data['position'] = this.data['position'] || [null, null];
    this.data['addMode'] = this.data['addMode'] || false;
    this.data['type'] = this.data['type'] || 'waypoint';
    this.data['skType'] = this.data['skType'] || '';

    this.icon =
      this.data['type'] === 'route'
        ? 'directions'
        : this.data['type'] === 'region'
        ? '360'
        : this.data['type'] === 'note'
        ? 'local_offer'
        : this.data['addMode']
        ? 'add_location'
        : 'edit_location';
  }
}

/********* AISPropertiesModal **********
	data: {
        title: "<string>" title text,
        target: "<SKVessel>" vessel,
        id: <string> vessel id
    }
***********************************/
@Component({
  selector: 'ap-ais-modal',
  template: `
    <div class="_ap-ais">
      <mat-toolbar>
        <span>
          <mat-icon color="primary"> directions_boat</mat-icon>
        </span>
        <span style="flex: 1 1 auto; padding-left:20px;text-align:center;">
          {{ data.title }}
        </span>
        <span>
          <button
            mat-icon-button
            (click)="modalRef.dismiss()"
            matTooltip="Close"
            matTooltipPosition="below"
          >
            <mat-icon>keyboard_arrow_down</mat-icon>
          </button>
        </span>
      </mat-toolbar>

      <mat-card>
        <div style="display:flex;flex-direction: column;">
          <div style="display:flex;">
            <div class="key-label">Name:</div>
            <div style="flex: 1 1 auto;">{{ vInfo.name }}</div>
          </div>
          <div style="display:flex;">
            <div class="key-label">MMSI:</div>
            <div style="flex: 1 1 auto;">{{ vInfo.mmsi }}</div>
          </div>
          <div style="display:flex;" *ngIf="vInfo.flag">
            <div class="key-label">Flag:</div>
            <div style="flex: 1 1 auto;">{{ vInfo.flag }}</div>
          </div>
          <div style="display:flex;" *ngIf="vInfo.port">
            <div class="key-label">Port:</div>
            <div style="flex: 1 1 auto;">{{ vInfo.port }}</div>
          </div>
          <div style="display:flex;" *ngIf="vInfo.callsign">
            <div class="key-label">Call sign:</div>
            <div style="flex: 1 1 auto;">{{ vInfo.callsign }}</div>
          </div>
          <div style="display:flex;" *ngIf="vInfo.length">
            <div class="key-label">Dimensions:</div>
            <div style="flex: 1 1 auto;">
              {{ vInfo.length }} x {{ vInfo.beam }}
            </div>
          </div>
          <div style="display:flex;" *ngIf="vInfo.draft">
            <div class="key-label">Draft:</div>
            <div style="flex: 1 1 auto;">{{ vInfo.draft }}</div>
          </div>
          <div style="display:flex;" *ngIf="vInfo.height">
            <div class="key-label">Height:</div>
            <div style="flex: 1 1 auto;">{{ vInfo.height }}</div>
          </div>
          <div style="display:flex;" *ngIf="vInfo.state">
            <div class="key-label">State:</div>
            <div style="flex: 1 1 auto;">{{ vInfo.state }}</div>
          </div>
          <div style="display:flex;" *ngIf="vInfo.destination">
            <div class="key-label">Destination:</div>
            <div style="flex: 1 1 auto;">{{ vInfo.destination }}</div>
          </div>
          <div style="display:flex;" *ngIf="vInfo.eta">
            <div class="key-label">ETA:</div>
            <div style="flex: 1 1 auto;">{{ vInfo.eta.toLocaleString() }}</div>
          </div>
          <signalk-details-list
            [details]="data.target.properties"
          ></signalk-details-list>
        </div>
      </mat-card>
    </div>
  `,
  styles: [
    `
      ._ap-ais {
        font-family: arial;
      }
      ._ap-ais .key-label {
        width: 150px;
        font-weight: bold;
      }
    `
  ]
})
export class AISPropertiesModal implements OnInit {
  public target: SKVessel;
  public vInfo = {
    name: null,
    mmsi: null,
    callsign: null,
    length: null,
    beam: null,
    draft: null,
    height: null,
    shipType: null,
    destination: null,
    eta: null,
    state: null,
    flag: null,
    port: null
  };

  constructor(
    public app: AppInfo,
    private sk: SignalKClient,
    public modalRef: MatBottomSheetRef<AISPropertiesModal>,
    @Inject(MAT_BOTTOM_SHEET_DATA)
    public data: {
      title: string;
      target: SKVessel;
      id: string;
    }
  ) {}

  ngOnInit() {
    this.target = this.data.target;
    this.getVesselInfo();
  }

  formatDegrees(val: number) {
    return val
      ? `${Convert.radiansToDegrees(val).toFixed(1)} ${String.fromCharCode(
          186
        )}`
      : '0.0';
  }

  formatKnots(val: number) {
    return val ? `${Convert.msecToKnots(val).toFixed(1)} kn` : '0.0';
  }

  private getVesselInfo() {
    let path: string;
    if (!this.data.id) {
      path = 'vessels/self';
    } else {
      path = this.data.id.split('.').join('/');
    }

    this.sk.api.get(path).subscribe((v) => {
      if (typeof v['name'] !== 'undefined') {
        this.vInfo.name = v['name'];
      }
      if (typeof v['mmsi'] !== 'undefined') {
        this.vInfo.mmsi = v['mmsi'];
      }
      if (typeof v['flag'] !== 'undefined') {
        this.vInfo.flag = v['flag'];
      }
      if (typeof v['port'] !== 'undefined') {
        this.vInfo.port = v['port'];
      }
      if (typeof v['communication'] !== 'undefined') {
        if (typeof v['communication']['callsignVhf'] !== 'undefined') {
          this.vInfo.callsign = v['communication']['callsignVhf'];
        }
      }
      if (typeof v['navigation'] !== 'undefined') {
        if (typeof v['navigation']['destination'] !== 'undefined') {
          if (
            typeof v['navigation']['destination']['commonName'] !== 'undefined'
          ) {
            this.vInfo.destination =
              v['navigation']['destination']['commonName']['value'];
          }
          if (typeof v['navigation']['destination']['eta'] !== 'undefined') {
            this.vInfo.eta = new Date(
              v['navigation']['destination']['eta']['value']
            ).toUTCString();
          }
        }
        if (
          typeof v['navigation']['state'] !== 'undefined' &&
          typeof v['navigation']['state']['value'] !== 'undefined'
        ) {
          this.vInfo.state = v['navigation']['state']['value'];
        }
      }
      if (typeof v['design'] !== 'undefined') {
        if (
          typeof v['design']['length'] !== 'undefined' &&
          v['design']['length']['value']['overall']
        ) {
          this.vInfo.length = v['design']['length']['value']['overall'];
        }
        if (typeof v['design']['beam'] !== 'undefined') {
          this.vInfo.beam = v['design']['beam']['value'];
        }
        if (
          typeof v['design']['draft'] !== 'undefined' &&
          v['design']['draft']['value']
        ) {
          if (typeof v['design']['draft']['value']['maximum'] !== 'undefined') {
            this.vInfo.draft = `${v['design']['draft']['value']['maximum']} (max)`;
          } else if (
            typeof v['design']['draft']['value']['current'] !== 'undefined'
          ) {
            this.vInfo.draft = `${v['design']['draft']['value']['current']} (current)`;
          }
        }
        if (typeof v['design']['airHeight'] !== 'undefined') {
          this.vInfo.height = v['design']['airHeight']['value'];
        }
        if (typeof v['design']['aisShipType'] !== 'undefined') {
          this.vInfo.shipType = v['design']['aisShipType']['value']['name'];
        }
      }
    });
  }
}

/********* AtoNPropertiesModal **********
	data: {
        title: "<string>" title text,
        target: "<SKAtoN>" aid to navigation
        icon: <string>
    }
***********************************/
@Component({
  selector: 'ap-aton-modal',
  template: `
    <div class="_ap-aton">
      <mat-toolbar>
        <span>
          <mat-icon color="primary"> {{ data.icon }}</mat-icon>
        </span>
        <span style="flex: 1 1 auto; padding-left:20px;text-align:center;">
          {{ data.title }}
        </span>
        <span>
          <button
            mat-icon-button
            (click)="modalRef.dismiss()"
            matTooltip="Close"
            matTooltipPosition="below"
          >
            <mat-icon>keyboard_arrow_down</mat-icon>
          </button>
        </span>
      </mat-toolbar>

      <mat-card>
        <div style="display:flex;flex-direction: column;">
          <div style="display:flex;">
            <div class="key-label">Name:</div>
            <div style="flex: 1 1 auto;">{{ data.target.name }}</div>
          </div>
          <div style="display:flex;">
            <div class="key-label">MMSI:</div>
            <div style="flex: 1 1 auto;">{{ data.target.mmsi }}</div>
          </div>
          <div style="display:flex;">
            <div class="key-label">Type:</div>
            <div style="flex: 1 1 auto;">{{ data.target.type.name }}</div>
          </div>
          <signalk-details-list
            [details]="data.target.properties"
          ></signalk-details-list>
        </div>
      </mat-card>
    </div>
  `,
  styles: [
    `
      ._ap-aton {
        font-family: arial;
        min-width: 300px;
      }
      ._ap-aton .key-label {
        width: 150px;
        font-weight: bold;
      }
    `
  ]
})
export class AtoNPropertiesModal implements OnInit {
  public target: SKAtoN;

  constructor(
    public modalRef: MatBottomSheetRef<AtoNPropertiesModal>,
    @Inject(MAT_BOTTOM_SHEET_DATA)
    public data: {
      title: string;
      target: SKAtoN;
      icon: string;
    }
  ) {}

  ngOnInit() {
    this.target = this.data.target;
  }
}

/********* AircraftPropertiesModal **********
	data: {
        title: "<string>" title text,
        target: "<SKAircraft>" aid to navigation
    }
***********************************/
@Component({
  selector: 'ap-aircraft-modal',
  template: `
    <div class="_ap-aircraft">
      <mat-toolbar>
        <span>
          <mat-icon color="primary"> airplanemode_active</mat-icon>
        </span>
        <span style="flex: 1 1 auto; padding-left:20px;text-align:center;">
          {{ data.title }}
        </span>
        <span>
          <button
            mat-icon-button
            (click)="modalRef.dismiss()"
            matTooltip="Close"
            matTooltipPosition="below"
          >
            <mat-icon>keyboard_arrow_down</mat-icon>
          </button>
        </span>
      </mat-toolbar>

      <mat-card>
        <div style="display:flex;flex-direction: column;">
          <div style="display:flex;">
            <div class="key-label">Name:</div>
            <div style="flex: 1 1 auto;">{{ data.target.name }}</div>
          </div>
          <div style="display:flex;">
            <div class="key-label">MMSI:</div>
            <div style="flex: 1 1 auto;">{{ data.target.mmsi }}</div>
          </div>
          <div style="display:flex;">
            <div class="key-label">Call sign:</div>
            <div style="flex: 1 1 auto;">{{ data.target.callsign }}</div>
          </div>
          <!--<div style="display:flex;" *ngFor="let p of data.target.properties | keyvalue">
                        <div class="key-label">{{p.key}}:</div>
                        <div style="flex: 1 1 auto;">{{p.value}}</div>
                    </div>-->
          <signalk-details-list
            [details]="data.target.properties"
          ></signalk-details-list>
        </div>
      </mat-card>
    </div>
  `,
  styles: [
    `
      ._ap-aircraft {
        font-family: arial;
        min-width: 300px;
      }
      ._ap-aircraft .key-label {
        width: 150px;
        font-weight: bold;
      }
    `
  ]
})
export class AircraftPropertiesModal implements OnInit {
  public target: SKAircraft;

  constructor(
    public modalRef: MatBottomSheetRef<AircraftPropertiesModal>,
    @Inject(MAT_BOTTOM_SHEET_DATA)
    public data: {
      title: string;
      target: SKAircraft;
      icon: string;
    }
  ) {}

  ngOnInit() {
    this.target = this.data.target;
  }
}

/********* ActiveResourcePropertiesModal **********
	data: {
        title: "<string>" title text,
        type: 'dest' | 'route' resource type,
        resource: "<SKWaypoint | SKRoute>" active resource info
        skres: pointer to SKResources service
    }
***********************************/
@Component({
  selector: 'ap-dest-modal',
  template: `
    <div class="_ap-dest" style="display:flex;flex-direction:column;">
      <div>
        <mat-toolbar>
          <span>
            <button
              mat-button
              color="primary"
              *ngIf="showClearButton"
              (click)="deactivate()"
              [matTooltip]="clearButtonText"
            >
              <mat-icon>clear_all</mat-icon>
              Clear
            </button>
          </span>
          <span
            style="flex: 1 1 auto; padding-left:20px;text-align:center;text-overflow: ellipsis;white-space: nowrap; overflow: hidden;"
          >
            {{ data.title }}
          </span>
          <span>
            <button
              mat-icon-button
              (click)="close()"
              matTooltip="Close"
              matTooltipPosition="below"
            >
              <mat-icon>keyboard_arrow_down</mat-icon>
            </button>
          </span>
        </mat-toolbar>
      </div>

      <div
        style="flex: 1 1 auto;position:relative;overflow:hidden;min-height:200px;"
      >
        <div
          style="top:0;left:0;right:0;bottom:0;position:absolute;
                    overflow:auto;"
          cdkDropList
          (cdkDropListDropped)="drop($event)"
        >
          <mat-card *ngFor="let pt of points; let i = index" cdkDrag>
            <div class="point-drop-placeholder" *cdkDragPlaceholder></div>

            <div
              style="display:flex;"
              (click)="selectPoint(i)"
              [style.cursor]="
                points.length > 1 && selIndex != -1 ? 'pointer' : 'initial'
              "
            >
              <div style="width:35px;">
                <mat-icon [color]="'warn'" *ngIf="selIndex == i">
                  flag
                </mat-icon>
              </div>
              <div style="flex: 1 1 auto;">
                <div style="display:flex;">
                  <div class="key-label">Lat:</div>
                  <div
                    style="flex: 1 1 auto;"
                    [innerText]="
                      pt[1] | coords: app.config.selections.positionFormat:true
                    "
                  ></div>
                </div>
                <div style="display:flex;">
                  <div class="key-label">Lon:</div>
                  <div
                    style="flex: 1 1 auto;"
                    [innerText]="
                      pt[0] | coords: app.config.selections.positionFormat
                    "
                  ></div>
                </div>
                <div style="display:flex;" *ngIf="i < pointNames.length">
                  <div class="key-label">Name:</div>
                  <div
                    style="flex: 1 1 auto;"
                    [innerText]="pointNames[i]"
                  ></div>
                </div>
              </div>
              <div cdkDragHandle matTooltip="Drag to re-order points">
                <mat-icon *ngIf="data.type === 'route'"
                  >drag_indicator</mat-icon
                >
              </div>
            </div>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      ._ap-dest {
        font-family: arial;
        min-width: 300px;
      }
      ._ap-dest .key-label {
        width: 50px;
        font-weight: bold;
      }
      ._ap-dest .selected {
        background-color: silver;
      }
      .point-drop-placeholder {
        background: #ccc;
        border: dotted 3px #999;
        min-height: 90px;
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }
      .cdk-drag-preview {
        box-sizing: border-box;
        border-radius: 4px;
        box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
          0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12);
      }
    `
  ]
})
export class ActiveResourcePropertiesModal implements OnInit {
  public points: Array<Position> = [];
  public pointNames: Array<string> = [];
  public selIndex = -1;
  public clearButtonText = 'Clear';
  public showClearButton = false;

  constructor(
    public app: AppInfo,
    public modalRef: MatBottomSheetRef<ActiveResourcePropertiesModal>,
    @Inject(MAT_BOTTOM_SHEET_DATA)
    public data: {
      title: string;
      type: string;
      resource: SKWaypoint | SKRoute;
      skres: any;
    }
  ) {}

  ngOnInit() {
    if (
      this.data.resource[1].feature &&
      this.data.resource[1].feature.geometry.coordinates
    ) {
      if (this.data.type == 'route') {
        this.points = this.data.resource[1].feature.geometry.coordinates;

        this.data.title = this.data.resource[1].name
          ? `
                    ${this.data.resource[1].name} Points`
          : 'Route Points';

        if (this.data.resource[0] === this.app.data.activeRoute) {
          this.selIndex = this.app.data.navData.pointIndex;
          this.showClearButton = true;
        }
        if (
          this.data.resource[1].feature.properties.points &&
          this.data.resource[1].feature.properties.points.names &&
          Array.isArray(this.data.resource[1].feature.properties.points.names)
        ) {
          this.pointNames =
            this.data.resource[1].feature.properties.points.names;
        }
      }
      /*else {
                if(this.app.data.activeRoute) {
                    const rte= this.app.data.routes.filter(i=> { 
                        return (i[0]===this.app.data.activeRoute) ? true : false;
                    })[0];
                    if(rte.length!=0) {
                        this.points= rte[1].feature.geometry.coordinates;
                        this.data.title= (rte[1].name) ? `${rte[1].name} Points` : 'Active Route Points';
                        this.selIndex= this.app.data.navData.pointIndex;
                    }
                }
                else { 
                    this.data.title= (this.data.title) ? this.data.title : 'Destination';
                    this.points= [this.data.resource[1].feature.geometry.coordinates];
                    this.clearButtonText= 'Clear Destination';
                }
            }*/
    }
  }

  selectPoint(idx: number) {
    if (this.points.length < 2 || this.selIndex < 0) {
      return;
    }
    this.selIndex = idx;
    if (this.data.skres) {
      this.data.skres.coursePointIndex(this.selIndex);
    }
  }

  drop(e: CdkDragDrop<{ previousIndex: number; currentIndex: number }>) {
    if (this.data.type == 'route') {
      const selPosition = this.points[this.selIndex];
      moveItemInArray(this.points, e.previousIndex, e.currentIndex);
      this.updateFlag(selPosition);
      this.data.skres.updateRouteCoords(this.data.resource[0], this.points);
    }
  }

  updateFlag(selPosition: Position) {
    let idx = 0;
    this.points.forEach((p: Position) => {
      if (p[0] === selPosition[0] && p[1] === selPosition[1]) {
        this.selIndex = idx;
      }
      idx++;
    });
  }

  close() {
    this.modalRef.dismiss();
  }

  // ** deactivate route / clear destination
  deactivate() {
    this.modalRef.dismiss(true);
  }
}

/********* ChartInfoDialog **********
	data: <SKChart>
***********************************/
@Component({
  selector: 'ap-chartproperties',
  template: `
    <div class="_ap-chartinfo">
      <div style="display:flex;line-height:2.3em;">
        <div>
          <mat-icon color="primary">{{ isLocal(data['url']) }}</mat-icon>
        </div>
        <div
          style="flex: 1 1 auto; padding-left:20px;text-align:center;
                font-weight: bold;font-size: 16pt;"
        >
          Chart Properties
        </div>
        <div>
          <button
            mat-icon-button
            (click)="dialogRef.close()"
            matTooltip="Close"
            matTooltipPosition="below"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
      <mat-card>
        <div style="display:flex;flex-direction: column;">
          <div style="display:flex;">
            <div class="key-label">Name:</div>
            <div style="flex: 1 1 auto;">{{ data['name'] }}</div>
          </div>
          <div style="display:flex;">
            <div class="key-label">Description:</div>
            <div style="flex: 1 1 auto;">{{ data['description'] }}</div>
          </div>
          <div style="display:flex;">
            <div class="key-label">Scale:</div>
            <div style="flex: 1 1 auto;">{{ data['scale'] }}</div>
          </div>
          <div style="display:flex;">
            <div class="key-label">Zoom:</div>
            <div style="flex: 1 1 auto;">
              <div style="flex: 1 1 auto;">
                <u><i>Min: </i></u>
                {{ data['minZoom'] }},
                <u><i>Max: </i></u>
                {{ data['maxZoom'] }}
              </div>
            </div>
          </div>
          <div style="display:flex;" *ngIf="data['bounds']">
            <div class="key-label">Bounds:</div>
            <div
              style="flex: 1 1 auto; border: gray 1px solid;
                                max-width: 220px;font-size: 10pt;"
            >
              <div style="text-align:right;">
                <span
                  style="flex: 1 1 auto;"
                  [innerText]="data['bounds'][3] | coords: 'HDd':true"
                >
                </span
                ><br />
                <span
                  style="flex: 1 1 auto;"
                  [innerText]="data['bounds'][2] | coords: 'HDd'"
                >
                </span>
              </div>
              <div>
                <span
                  style="flex: 1 1 auto;"
                  [innerText]="data['bounds'][1] | coords: 'HDd':true"
                >
                </span
                ><br />
                <span
                  style="flex: 1 1 auto;"
                  [innerText]="data['bounds'][0] | coords: 'HDd'"
                >
                </span>
              </div>
            </div>
          </div>
          <div style="display:flex;">
            <div class="key-label">Format:</div>
            <div style="flex: 1 1 auto;">{{ data['format'] }}</div>
          </div>
          <div style="display:flex;">
            <div class="key-label">Type:</div>
            <div style="flex: 1 1 auto;">
              {{ data['type'] }}
            </div>
          </div>
          <div style="display:flex;">
            <div class="key-label">Layers:</div>
            <div style="flex: 1 1 auto;">{{ data['layers'] }}</div>
          </div>
          <div style="display:flex;">
            <div class="key-label">URL:</div>
            <div style="flex: 1 1 auto;overflow-x: auto;">
              {{ data['url'] }}
            </div>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [
    `
      ._ap-chartinfo {
        font-family: arial;
        min-width: 300px;
      }
      .ap-confirm-icon {
        min-width: 35px;
        max-width: 35px;
        color: darkorange;
        text-align: left;
      }

      ._ap-chartinfo .key-label {
        width: 150px;
        font-weight: 500;
      }

      @media only screen and (min-device-width: 768px) and (max-device-width: 1024px),
        only screen and (min-width: 800px) {
        .ap-confirm-icon {
          min-width: 25%;
          max-width: 25%;
        }
      }
    `
  ]
})
export class ChartInfoDialog {
  public icon: string;

  constructor(
    public app: AppInfo,
    public dialogRef: MatDialogRef<ChartInfoDialog>,
    @Inject(MAT_DIALOG_DATA) public data: SKChart
  ) {}

  isLocal(url: string) {
    return url && url.indexOf('signalk') != -1 ? 'map' : 'language';
  }
}

/********* TracksModal **********
	data: {
        title: "<string>" title text
        skres: SKTrack
    }
***********************************/
@Component({
  selector: 'ap-tracks-modal',
  template: `
    <div class="_ap-tracks">
      <mat-toolbar>
        <span>
          <button
            mat-icon-button
            [disabled]="app.config.selections.tracks.length == 0"
            matTooltip="Clear selections"
            matTooltipPosition="right"
            (click)="clearSelections()"
          >
            <mat-icon>check_box_outline_blank</mat-icon>
          </button>

          <button
            mat-icon-button
            matTooltip="Fetch track entries"
            matTooltipPosition="right"
            (click)="getTracks()"
          >
            <mat-icon color="primary">refresh</mat-icon>
          </button>
        </span>
        <span style="flex: 1 1 auto; padding-left:20px;text-align:center;">
          {{ data.title }}
        </span>
        <span>
          <button
            mat-icon-button
            (click)="closeModal()"
            matTooltip="Close"
            matTooltipPosition="left"
          >
            <mat-icon>keyboard_arrow_down</mat-icon>
          </button>
        </span>
      </mat-toolbar>

      <mat-card *ngFor="let trk of trackList; let idx = index">
        <div style="display:flex;flex-wrap:no-wrap;">
          <div style="width:45px;">
            <mat-checkbox
              color="primary"
              [checked]="selTrk[idx]"
              (change)="handleCheck($event.checked, trk[0], idx)"
            ></mat-checkbox>
          </div>
          <div style="flex:1 1 auto;">
            <div class="key-label">
              {{ trk[1].feature?.properties?.name }}
            </div>
            <div class="key-desc">
              {{ trk[1].feature?.properties?.description }}
            </div>
          </div>
          <div style="width:45px;">
            <button
              mat-icon-button
              color="warn"
              matTooltip="Delete Track"
              matTooltipPosition="left"
              (click)="handleDelete(trk[0])"
            >
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [
    `
      ._ap-tracks {
        font-family: arial;
        min-width: 300px;
      }
      ._ap-tracks .key-label {
        font-weight: 500;
      }
      ._ap-tracks .key-desc {
        font-style: italic;
      }
    `
  ]
})
export class TracksModal implements OnInit {
  public trackList: Array<[string, SKTrack]>;
  public selTrk = [];

  constructor(
    public app: AppInfo,
    private cdr: ChangeDetectorRef,
    private sk: SignalKClient,
    public modalRef: MatBottomSheetRef<TracksModal>,
    @Inject(MAT_BOTTOM_SHEET_DATA)
    public data: {
      title: string;
      skres: any;
    }
  ) {}

  ngOnInit() {
    if (this.data.title === 'undefined') {
      this.data['title'] = 'Tracks';
    }
    this.getTracks();
  }

  closeModal() {
    this.modalRef.dismiss();
  }

  getTracks() {
    this.sk.api.get(this.app.skApiVersion, '/resources/tracks').subscribe(
      (trks) => {
        this.trackList = Object.entries(trks).map((trk: [string, SKTrack]) => {
          trk[1]['feature']['id'] = trk[0].toString();
          delete trk[1]['$source'];
          delete trk[1]['timestamp'];
          return trk;
        });
        this.selTrk = [];
        for (let i = 0; i < this.trackList.length; i++) {
          this.selTrk.push(
            this.app.config.selections.tracks.includes(this.trackList[i][0])
              ? true
              : false
          );
        }
        this.cdr.detectChanges();
      },
      () => {
        this.trackList = [];
        this.selTrk = [];
        this.cdr.detectChanges();
      }
    );
  }

  handleDelete(id: string) {
    if (!this.data.skres) {
      return;
    }
    this.trackList = this.trackList.filter((t) => {
      return t[0] == id ? false : true;
    });
    this.data.skres.showTrackDelete(id).subscribe((ok) => {
      if (ok) {
        const i = this.app.config.selections.tracks.indexOf(id);
        if (i != -1) {
          this.app.config.selections.tracks.splice(i, 1);
        }
        this.data.skres.deleteTrack(id);
        setTimeout(this.getTracks.bind(this), 2000);
        this.app.saveConfig();
      } else {
        this.getTracks();
      }
    });
  }

  handleCheck(checked: boolean, id: string, idx: number) {
    this.selTrk[idx] = checked;
    if (checked) {
      this.app.config.selections.tracks.push(id);
    } else {
      const i = this.app.config.selections.tracks.indexOf(id);
      if (i != -1) {
        this.app.config.selections.tracks.splice(i, 1);
      }
    }
    this.app.saveConfig();
    this.updateTracks();
  }

  clearSelections() {
    this.selTrk = [];
    for (let i = 0; i < this.trackList.length; i++) {
      this.selTrk[i] = false;
    }
    this.app.config.selections.tracks = [];
    this.app.saveConfig();
    this.updateTracks();
  }

  updateTracks() {
    this.app.data.tracks = this.trackList
      .map((trk) => {
        return trk[1];
      })
      .filter((t) => {
        return this.app.config.selections.tracks.includes(t.feature.id)
          ? true
          : false;
      });
    if (this.data.skres) {
      this.data.skres.trackSelected();
    }
  }
}

/********* ResourceSetModal **********
	data: {
        path: "<string>" resource path
        skres: SKResource
    }
***********************************/
@Component({
  selector: 'ap-resourceset-modal',
  template: `
    <div class="_ap-resource-set">
      <mat-toolbar>
        <span>
          <button
            mat-icon-button
            [disabled]="
              !isResourceSet ||
              app.config.selections.resourceSets[data.path].length == 0
            "
            matTooltip="Clear selections"
            matTooltipPosition="right"
            (click)="clearSelections()"
          >
            <mat-icon>check_box_outline_blank</mat-icon>
          </button>

          <button
            mat-icon-button
            matTooltip="Fetch resource entries"
            matTooltipPosition="right"
            (click)="getItems()"
          >
            <mat-icon color="primary">refresh</mat-icon>
          </button>
        </span>
        <span style="flex: 1 1 auto; padding-left:20px;text-align:center;">
          {{ title }}
        </span>
        <span>
          <button
            mat-icon-button
            (click)="closeModal()"
            matTooltip="Close"
            matTooltipPosition="left"
          >
            <mat-icon>keyboard_arrow_down</mat-icon>
          </button>
        </span>
      </mat-toolbar>

      <mat-card *ngFor="let res of resList; let idx = index">
        <div style="display:flex;flex-wrap:no-wrap;">
          <div style="width:45px;">
            <mat-checkbox
              color="primary"
              [disabled]="!isResourceSet"
              [checked]="selRes[idx]"
              (change)="handleCheck($event.checked, res.id, idx)"
            ></mat-checkbox>
          </div>
          <div style="flex:1 1 auto;">
            <div class="key-label">
              {{ res.name }}
            </div>
            <div class="key-desc">
              {{ res.description }}
            </div>
          </div>
          <div style="width:45px;"></div>
        </div>
      </mat-card>
    </div>
  `,
  styles: [
    `
      ._ap-resource-set {
        font-family: arial;
        min-width: 300px;
      }
      ._ap-resource-set .key-label {
        font-weight: 500;
      }
      ._ap-resource-set .key-desc {
        font-style: italic;
      }
    `
  ]
})
export class ResourceSetModal implements OnInit {
  public resList: Array<SKResourceSet>;
  public selRes = [];
  public title = 'Resources: ';
  public isResourceSet = false;

  constructor(
    public app: AppInfo,
    private cdr: ChangeDetectorRef,
    private sk: SignalKClient,
    public modalRef: MatBottomSheetRef<ResourceSetModal>,
    @Inject(MAT_BOTTOM_SHEET_DATA)
    public data: {
      path: string;
      skres: any;
    }
  ) {}

  ngOnInit() {
    if (this.data.path !== 'undefined') {
      this.title += this.data.path;
    }
    this.getItems();
  }

  closeModal() {
    this.modalRef.dismiss();
  }

  getItems() {
    this.sk.api
      .get(this.app.skApiVersion, `resources/${this.data.path}`)
      .subscribe(
        (resSet) => {
          this.resList = this.data.skres.processItems(resSet);
          this.selRes = [];
          if (
            this.resList.length !== 0 &&
            this.resList[0].type === 'ResourceSet'
          ) {
            this.isResourceSet = true;
            for (let i = 0; i < this.resList.length; i++) {
              this.selRes.push(
                this.app.config.selections.resourceSets[
                  this.data.path
                ].includes(this.resList[i].id)
                  ? true
                  : false
              );
            }
          }
          this.cdr.detectChanges();
        },
        () => {
          this.resList = [];
          this.selRes = [];
          this.cdr.detectChanges();
        }
      );
  }

  handleCheck(checked: boolean, id: string, idx: number) {
    if (!this.isResourceSet) {
      return;
    }
    this.selRes[idx] = checked;
    if (checked) {
      this.app.config.selections.resourceSets[this.data.path].push(id);
    } else {
      const i =
        this.app.config.selections.resourceSets[this.data.path].indexOf(id);
      if (i != -1) {
        this.app.config.selections.resourceSets[this.data.path].splice(i, 1);
      }
    }
    this.app.saveConfig();
    this.updateItems();
    this.data.skres.resourceSelected();
  }

  clearSelections() {
    if (!this.isResourceSet) {
      return;
    }
    this.selRes = [];
    for (let i = 0; i < this.resList.length; i++) {
      this.selRes[i] = false;
    }
    this.app.config.selections.resourceSets[this.data.path] = [];
    this.app.saveConfig();
    this.updateItems();
    this.data.skres.resourceSelected();
  }

  updateItems() {
    this.app.data.resourceSets[this.data.path] = this.resList.filter((t) => {
      return this.app.config.selections.resourceSets[this.data.path].includes(
        t.id
      )
        ? true
        : false;
    });
  }
}
