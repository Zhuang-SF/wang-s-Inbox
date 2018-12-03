import { Injectable } from '@angular/core';
import { CoreHttpService } from 'src/app/service/core-http.service';
import { from, Observable } from 'rxjs';
import { map, mergeMap, flatMap } from 'rxjs/operators';

import * as uid from 'uid';

@Injectable({
  providedIn: 'root'
})
export class DaigouService {
  constructor(private coreService: CoreHttpService) {}

  addToBuy(payload) {

    let userid = ''
    console.log(payload);

    const db = this.coreService.fireStore();

    const daigouRef$ = from(
      db
        .collection('daigou')
        .doc(payload.docId)
        .get()
    );

    return daigouRef$.pipe(
      map(result => {
        if (result.exists) {
          let doc = result.data();
          let recordCollection = [];
          userid = doc.userid;
          let record = doc.record;
          record.forEach((element, index) => {
            recordCollection.push(element);
          });

          recordCollection.push({
            itemname: payload.itemname,
            number: payload.number,
            status: false,
            uid: uid()
          });
          doc.record = recordCollection;
          return doc;
        }
        return null;
      }),
      mergeMap(result => {
        console.log(result);

        return from(
          db
            .collection('daigou')
            .doc(payload.docId)
            .set(result)
        );
      }),
      map(result => {
        return userid;
      })
    );
    return null;
  }

  updateDaigouTable(payload) {
    console.log('coming: ', payload);

    let userid = '';

    const db = this.coreService.fireStore();

    const daigouRef$ = from(
      db
        .collection('daigou')
        .doc(payload.docId)
        .get()
    );

    return daigouRef$.pipe(
      map((result: any) => {
        if (result.exists) {
          console.log('获取该列的数据', result.data());
          let doc = result.data();
          userid = doc.userid;
          let record = doc.record;
          record.forEach((element, index) => {
            if (element.uid == payload.uid) {
              record[index] = {
                ...record[index],
                ...{
                  status: true,
                  tracknumber: payload.tracknumber,
                  progress: ''
                }
              };
            }
          });
          return doc;
        }
        return null;
      }),
      mergeMap(result => {
        console.log(result);

        return from(
          db
            .collection('daigou')
            .doc(payload.docId)
            .set(result)
        );
      }),
      map(result => {
        return userid;
      })
    );
  }

  consumeDaigouTable(userid): Observable<any> {
    const db = this.coreService.fireStore();
    const daigouRef = db.collection('daigou');

    const daigouRef$ = from(daigouRef.where('userid', '==', userid).get());

    return daigouRef$.pipe(
      map(value => {
        const daigou = { dUserList: [], dTrackingList: [], dToBuyList: [] };
        const data = [];
        let record = [];
        let tobuy = [];
        value.forEach(element => {
          console.log(element.id);
          data.push({ ...element.data(), ...{ docId: element.id } });
          const rr = [];
          const tt = [];
          for (let index = 0; index < element.data().record.length; index++) {
            element.data().record[index].buyer = element.data().name;
            let item = {
              ...element.data().record[index],
              ...{
                buyer: element.data().name,
                docId: element.id
              }
            };
            !item.status ? tt.push(item) : rr.push(item);
          }
          record = [...record, ...rr];
          tobuy = [...tobuy, ...tt];
        });

        daigou.dUserList = data;
        daigou.dTrackingList = record;
        daigou.dToBuyList = tobuy;
        return daigou;
      })
    );
  }
}