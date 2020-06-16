/// <reference path="HeartbeatService.d.ts" />
//
// Autogenerated by Thrift Compiler (0.14.0)
//
// DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
//

import thrift = require('thrift');
import Thrift = thrift.Thrift;
import Q = thrift.Q;
import Int64 = require('node-int64');
import shared_ttypes = require('./shared_types');


import ttypes = require('./codecoverage_types');
import CODECOVERAGE_SERVICE = ttypes.CODECOVERAGE_SERVICE
import HeartbeatService = require('./HeartbeatService');

declare class Client extends HeartbeatService.Client {
  #output: thrift.TTransport;
  #pClass: thrift.TProtocol;
  #_seqid: number;

  constructor(output: thrift.TTransport, pClass: { new(trans: thrift.TTransport): thrift.TProtocol });

  getSessionId(): Int64;

  getSessionId(callback?: (error: void, response: Int64)=>void): void;

  enable(enable: boolean): boolean;

  enable(enable: boolean, callback?: (error: void, response: boolean)=>void): void;

  isEnabled(): boolean;

  isEnabled(callback?: (error: void, response: boolean)=>void): void;

  hasMetaDataSupport(): boolean;

  hasMetaDataSupport(callback?: (error: void, response: boolean)=>void): void;

  clearCachedData(): void;

  clearCachedData(callback?: (error: void, response: void)=>void): void;

  isInitialized(): boolean;

  isInitialized(callback?: (error: void, response: boolean)=>void): void;

  initializeMetaData(): void;

  initializeMetaData(callback?: (error: void, response: void)=>void): void;

  reinitMetaData(): boolean;

  reinitMetaData(callback?: (error: void, response: boolean)=>void): void;

  refreshMetaData(): void;

  refreshMetaData(callback?: (error: void, response: void)=>void): void;

  getXMLData(): string;

  getXMLData(callback?: (error: void, response: string)=>void): void;
}

declare class Processor extends HeartbeatService.Processor {
  #_handler: object;

  constructor(handler: object);
  process(input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_getSessionId(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_enable(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_isEnabled(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_hasMetaDataSupport(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_clearCachedData(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_isInitialized(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_initializeMetaData(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_reinitMetaData(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_refreshMetaData(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
  process_getXMLData(seqid: number, input: thrift.TProtocol, output: thrift.TProtocol): void;
}